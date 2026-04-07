"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { logCandidateViolation } from "@/components/admin/lib/backendApi";
import { readRuntimeState, saveRuntimeState } from "@/components/candidate/security/runtimeStore";

type SecurityConfig = {
  forceFullscreen?: boolean;
  disableTabSwitch?: boolean;
  autoEndOnTabChange?: boolean;
  disableCopyPaste?: boolean;
  disableRightClick?: boolean;
  detectDevTools?: boolean;
  warningLimit?: number;
};

type UseCandidateSecurityGuardArgs = {
  submissionId: string;
  candidateSessionToken: string;
  durationMinutes: number;
  security: SecurityConfig;
  onAutoSubmit: (reason: string) => Promise<void> | void;
};

type WarningPopup = {
  id: number;
  title: string;
  message: string;
  warningCount: number;
  warningLimit: number;
};

function getViolationText(type: string) {
  switch (type) {
    case "tab_switch":
      return {
        title: "Tab Switch Detected",
        message: "You switched tabs. Please stay on the test screen.",
      };
    case "tab_switch_auto_end":
      return {
        title: "Tab Switch Detected",
        message: "Tab switching is not allowed for this test.",
      };
    case "right_click_blocked":
      return {
        title: "Right Click Blocked",
        message: "Right click is disabled during the test.",
      };
    case "clipboard_attempt":
    case "clipboard_shortcut":
      return {
        title: "Copy/Paste Blocked",
        message: "Copy/paste actions are not allowed during the test.",
      };
    case "devtools_open":
      return {
        title: "Developer Tools Detected",
        message: "Developer tools usage is monitored and not allowed.",
      };
    case "fullscreen_exit":
      return {
        title: "Fullscreen Required",
        message: "Please remain in fullscreen mode throughout the test.",
      };
    default:
      return {
        title: "Security Warning",
        message: "A restricted action was detected.",
      };
  }
}

export function useCandidateSecurityGuard({
  submissionId,
  candidateSessionToken,
  durationMinutes,
  security,
  onAutoSubmit,
}: UseCandidateSecurityGuardArgs) {
  const pathname = usePathname();
  const isExamRoute =
    pathname === "/candidate/test" ||
    pathname === "/candidate/assessment" ||
    pathname === "/candidate/tasks";
  const warningLimit = useMemo(() => security.warningLimit || 2, [security.warningLimit]);
  const initialRuntime = submissionId ? readRuntimeState(submissionId) : null;
  const [deadlineAt] = useState(() => {
    if (initialRuntime?.deadlineAt) return initialRuntime.deadlineAt;
    return Date.now() + durationMinutes * 60 * 1000;
  });
  const [warningCount, setWarningCount] = useState(initialRuntime?.warningCount || 0);
  const warningCountRef = useRef(initialRuntime?.warningCount || 0);
  const [warningPopup, setWarningPopup] = useState<WarningPopup | null>(null);
  const hasAutoSubmittedRef = useRef(false);
  const guardArmedAtRef = useRef<number>(Date.now() + 100);
  const tabHiddenTimerRef = useRef<number | null>(null);
  const lastViolationAtRef = useRef<Record<string, number>>({});
  const lastTabViolationAtRef = useRef<number>(0);
  const devtoolsConsecutiveOpenRef = useRef(0);
  const wasLikelyFullscreenRef = useRef<boolean>(false);

  const isLikelyFullscreen = useCallback(() => {
    if (typeof window === "undefined" || typeof screen === "undefined") return false;
    if (Boolean(document.fullscreenElement)) return true;
    const widthOk = window.innerWidth >= screen.width - 5;
    const heightOk = window.innerHeight >= screen.height - 5;
    return widthOk && heightOk;
  }, []);

  useEffect(() => {
    warningCountRef.current = warningCount;
  }, [warningCount]);

  const triggerAutoSubmit = useCallback(async (reason: string) => {
    if (hasAutoSubmittedRef.current) return;
    hasAutoSubmittedRef.current = true;
    await onAutoSubmit(reason);
  }, [onAutoSubmit]);

  const emitViolation = useCallback(async (type: string, meta: Record<string, unknown> = {}) => {
    if (Date.now() < guardArmedAtRef.current) return;
    const now = Date.now();
    const lastAt = lastViolationAtRef.current[type] || 0;
    if (now - lastAt < 350) return;
    lastViolationAtRef.current[type] = now;

    const nextWarningsLocal = warningCountRef.current + 1;
    warningCountRef.current = nextWarningsLocal;
    setWarningCount(nextWarningsLocal);
    const violationText = getViolationText(type);
    setWarningPopup({
      id: Date.now(),
      title: violationText.title,
      message: violationText.message,
      warningCount: nextWarningsLocal,
      warningLimit: warningLimit,
    });
    const runtimeBefore = readRuntimeState(submissionId);
    if (runtimeBefore) {
      saveRuntimeState(submissionId, { ...runtimeBefore, warningCount: nextWarningsLocal });
    }

    const tabSwitchAutoEndEnabled = Boolean(security.disableTabSwitch && security.autoEndOnTabChange);
    const isTabSwitchViolation = type === "tab_switch" || type === "tab_switch_auto_end";
    if (tabSwitchAutoEndEnabled && isTabSwitchViolation) {
      window.setTimeout(() => {
        void triggerAutoSubmit("tab_switch_auto_end");
      }, 400);
      return;
    }
    if (nextWarningsLocal >= warningLimit) {
      window.setTimeout(() => {
        void triggerAutoSubmit("warning_limit_reached");
      }, 1200);
    }

    try {
      const response = await logCandidateViolation({
        submissionId,
        candidateSessionToken,
        type,
        severity: "high",
        actionTaken: "warning_issued",
        meta,
      });
      const nextWarnings = Number.isFinite(response.warningCount) ? response.warningCount : nextWarningsLocal;
      warningCountRef.current = nextWarnings;
      setWarningCount(nextWarnings);
      setWarningPopup((prev) =>
        prev
          ? {
              ...prev,
              warningCount: nextWarnings,
              warningLimit,
            }
          : prev
      );
      const runtime = readRuntimeState(submissionId);
      if (runtime) {
        saveRuntimeState(submissionId, { ...runtime, warningCount: nextWarnings });
      }

      const shouldRespectBackendAutoEnd =
        Boolean(response.shouldAutoEnd) && tabSwitchAutoEndEnabled && isTabSwitchViolation;

      const shouldAutoEndByWarningLimit = Boolean(response.shouldAutoEnd);
      if (shouldRespectBackendAutoEnd || shouldAutoEndByWarningLimit) {
        // Let candidate see warning popup briefly before auto-ending.
        window.setTimeout(() => {
          void triggerAutoSubmit("warning_limit_reached");
        }, 1200);
      }
    } catch {
      // No-op: security should never hard-crash the test UI
    }
  }, [candidateSessionToken, security.autoEndOnTabChange, security.disableTabSwitch, submissionId, triggerAutoSubmit, warningLimit]);

  useEffect(() => {
    if (!isExamRoute) return;
    if (!submissionId) return;
    const existing = readRuntimeState(submissionId);
    if (!existing?.deadlineAt) {
      const nextDeadlineAt = Date.now() + durationMinutes * 60 * 1000;
      saveRuntimeState(submissionId, {
        deadlineAt: nextDeadlineAt,
        warningCount: 0,
      });
    }
  }, [durationMinutes, isExamRoute, submissionId]);

  useEffect(() => {
    if (!isExamRoute) return;
    if (!deadlineAt) return;
    const timeoutMs = Math.max(0, deadlineAt - Date.now());
    const timeout = window.setTimeout(() => {
      void triggerAutoSubmit("time_expired");
    }, timeoutMs);
    return () => window.clearTimeout(timeout);
  }, [deadlineAt, isExamRoute, triggerAutoSubmit]);

  useEffect(() => {
    if (!isExamRoute) return;
    if (!submissionId) return;
    if (!security.disableTabSwitch) return;
    const emitTabSwitchViolation = (source: string) => {
      const now = Date.now();
      if (now - lastTabViolationAtRef.current < 700) return;
      lastTabViolationAtRef.current = now;
      void emitViolation("tab_switch", { source });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (tabHiddenTimerRef.current) {
          window.clearTimeout(tabHiddenTimerRef.current);
        }
        tabHiddenTimerRef.current = window.setTimeout(() => {
          if (document.visibilityState !== "hidden") return;
          emitTabSwitchViolation("visibilitychange");
        }, 250);
      } else if (tabHiddenTimerRef.current) {
        window.clearTimeout(tabHiddenTimerRef.current);
        tabHiddenTimerRef.current = null;
      }
    };
    const onWindowBlur = () => {
      if (tabHiddenTimerRef.current) {
        window.clearTimeout(tabHiddenTimerRef.current);
      }
      tabHiddenTimerRef.current = window.setTimeout(() => {
        if (document.visibilityState === "hidden") {
          emitTabSwitchViolation("window_blur");
        }
      }, 250);
    };
    const onWindowFocus = () => {
      if (tabHiddenTimerRef.current) {
        window.clearTimeout(tabHiddenTimerRef.current);
        tabHiddenTimerRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      if (tabHiddenTimerRef.current) {
        window.clearTimeout(tabHiddenTimerRef.current);
        tabHiddenTimerRef.current = null;
      }
    };
  }, [emitViolation, isExamRoute, security.disableTabSwitch, submissionId]);

  useEffect(() => {
    if (!isExamRoute) return;
    if (!submissionId) return;
    if (!security.disableRightClick) return;
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      void emitViolation("right_click_blocked");
    };
    window.addEventListener("contextmenu", onContextMenu);
    return () => window.removeEventListener("contextmenu", onContextMenu);
  }, [emitViolation, isExamRoute, security.disableRightClick, submissionId]);

  useEffect(() => {
    if (!isExamRoute) return;
    if (!submissionId) return;
    if (!security.disableCopyPaste) return;
    const preventClipboard = (event: Event) => {
      event.preventDefault();
      void emitViolation("clipboard_attempt");
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isPrimaryCopyPaste =
        (event.ctrlKey || event.metaKey) && ["c", "v", "x", "insert"].includes(key);
      const isShiftInsert = event.shiftKey && key === "insert";
      if (isPrimaryCopyPaste || isShiftInsert) {
        event.preventDefault();
        void emitViolation("clipboard_shortcut");
      }
    };
    window.addEventListener("copy", preventClipboard);
    window.addEventListener("paste", preventClipboard);
    window.addEventListener("cut", preventClipboard);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("copy", preventClipboard);
      window.removeEventListener("paste", preventClipboard);
      window.removeEventListener("cut", preventClipboard);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [emitViolation, isExamRoute, security.disableCopyPaste, submissionId]);

  useEffect(() => {
    if (!isExamRoute) return;
    if (!submissionId) return;
    if (!security.detectDevTools) return;
    let devtoolsWasOpen = false;
    const interval = window.setInterval(() => {
      const widthDiff = Math.abs(window.outerWidth - window.innerWidth);
      const heightDiff = Math.abs(window.outerHeight - window.innerHeight);
      const isOpen = widthDiff > 220 || heightDiff > 220;
      if (isOpen) {
        devtoolsConsecutiveOpenRef.current += 1;
      } else {
        devtoolsConsecutiveOpenRef.current = 0;
      }
      if (isOpen && !devtoolsWasOpen && devtoolsConsecutiveOpenRef.current >= 2) {
        devtoolsWasOpen = true;
        void emitViolation("devtools_open");
      }
      if (!isOpen && devtoolsWasOpen) {
        devtoolsWasOpen = false;
      }
    }, 1500);
    return () => window.clearInterval(interval);
  }, [emitViolation, isExamRoute, security.detectDevTools, submissionId]);

  useEffect(() => {
    if (!isExamRoute) return;
    if (!submissionId) return;
    if (!security.forceFullscreen) return;

    let lastFullscreenRequestAt = 0;
    let resizeTimer: number | null = null;
    const requestFullscreen = async () => {
      lastFullscreenRequestAt = Date.now();
      if (!document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch {
          // ignore request errors
        }
      }
    };
    wasLikelyFullscreenRef.current = isLikelyFullscreen();
    void requestFullscreen();

    const checkFullscreenExit = () => {
      const nowLikelyFullscreen = isLikelyFullscreen();
      if (wasLikelyFullscreenRef.current && !nowLikelyFullscreen) {
        if (Date.now() - lastFullscreenRequestAt < 1200) return;
        void emitViolation("fullscreen_exit", { source: "fullscreen_exit_check" });
        void requestFullscreen();
      }
      wasLikelyFullscreenRef.current = nowLikelyFullscreen;
    };

    const onFullscreenChange = () => {
      checkFullscreenExit();
    };

    const onResize = () => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        checkFullscreenExit();
      }, 120);
    };

    window.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("resize", onResize);
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
    };
  }, [emitViolation, isExamRoute, isLikelyFullscreen, security.forceFullscreen, submissionId]);

  return {
    deadlineAt,
    warningCount,
    warningLimit,
    warningPopup,
    dismissWarningPopup: () => setWarningPopup(null),
  };
}
