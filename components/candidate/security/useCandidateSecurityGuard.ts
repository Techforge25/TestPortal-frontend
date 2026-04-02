"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const warningLimit = useMemo(() => security.warningLimit || 2, [security.warningLimit]);
  const initialRuntime = submissionId ? readRuntimeState(submissionId) : null;
  const [deadlineAt] = useState(() => {
    if (initialRuntime?.deadlineAt) return initialRuntime.deadlineAt;
    return Date.now() + durationMinutes * 60 * 1000;
  });
  const [warningCount, setWarningCount] = useState(initialRuntime?.warningCount || 0);
  const [warningPopup, setWarningPopup] = useState<WarningPopup | null>(null);
  const hasAutoSubmittedRef = useRef(false);

  const triggerAutoSubmit = useCallback(async (reason: string) => {
    if (hasAutoSubmittedRef.current) return;
    hasAutoSubmittedRef.current = true;
    await onAutoSubmit(reason);
  }, [onAutoSubmit]);

  const emitViolation = useCallback(async (type: string, meta: Record<string, unknown> = {}) => {
    try {
      const response = await logCandidateViolation({
        submissionId,
        candidateSessionToken,
        type,
        severity: "high",
        actionTaken: "warning_issued",
        meta,
      });
      const nextWarnings = response.warningCount;
      setWarningCount(nextWarnings);
      const violationText = getViolationText(type);
      setWarningPopup({
        id: Date.now(),
        title: violationText.title,
        message: violationText.message,
        warningCount: nextWarnings,
        warningLimit: warningLimit,
      });
      const runtime = readRuntimeState(submissionId);
      if (runtime) {
        saveRuntimeState(submissionId, { ...runtime, warningCount: nextWarnings });
      }

      if (response.shouldAutoEnd || nextWarnings >= warningLimit) {
        await triggerAutoSubmit("warning_limit_reached");
      }
    } catch {
      // No-op: security should never hard-crash the test UI
    }
  }, [candidateSessionToken, submissionId, triggerAutoSubmit, warningLimit]);

  useEffect(() => {
    if (!submissionId) return;
    const existing = readRuntimeState(submissionId);
    if (!existing?.deadlineAt) {
      const nextDeadlineAt = Date.now() + durationMinutes * 60 * 1000;
      saveRuntimeState(submissionId, {
        deadlineAt: nextDeadlineAt,
        warningCount: 0,
      });
    }
  }, [durationMinutes, submissionId]);

  useEffect(() => {
    if (!deadlineAt) return;
    const timeoutMs = Math.max(0, deadlineAt - Date.now());
    const timeout = window.setTimeout(() => {
      void triggerAutoSubmit("time_expired");
    }, timeoutMs);
    return () => window.clearTimeout(timeout);
  }, [deadlineAt, triggerAutoSubmit]);

  useEffect(() => {
    if (!submissionId) return;
    if (!security.disableTabSwitch) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (security.autoEndOnTabChange) {
          void triggerAutoSubmit("tab_switch_auto_end");
        } else {
          void emitViolation("tab_switch", { source: "visibilitychange" });
        }
      }
    };
    window.addEventListener("visibilitychange", onVisibilityChange);
    return () => window.removeEventListener("visibilitychange", onVisibilityChange);
  }, [emitViolation, security.autoEndOnTabChange, security.disableTabSwitch, submissionId, triggerAutoSubmit]);

  useEffect(() => {
    if (!submissionId) return;
    if (!security.disableRightClick) return;
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      void emitViolation("right_click_blocked");
    };
    window.addEventListener("contextmenu", onContextMenu);
    return () => window.removeEventListener("contextmenu", onContextMenu);
  }, [emitViolation, security.disableRightClick, submissionId]);

  useEffect(() => {
    if (!submissionId) return;
    if (!security.disableCopyPaste) return;
    const preventClipboard = (event: Event) => {
      event.preventDefault();
      void emitViolation("clipboard_attempt");
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && ["c", "v", "x"].includes(key)) {
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
  }, [emitViolation, security.disableCopyPaste, submissionId]);

  useEffect(() => {
    if (!submissionId) return;
    if (!security.detectDevTools) return;
    let devtoolsWasOpen = false;
    const interval = window.setInterval(() => {
      const widthDiff = Math.abs(window.outerWidth - window.innerWidth);
      const heightDiff = Math.abs(window.outerHeight - window.innerHeight);
      const isOpen = widthDiff > 160 || heightDiff > 160;
      if (isOpen && !devtoolsWasOpen) {
        devtoolsWasOpen = true;
        void emitViolation("devtools_open");
      }
      if (!isOpen && devtoolsWasOpen) {
        devtoolsWasOpen = false;
      }
    }, 1500);
    return () => window.clearInterval(interval);
  }, [emitViolation, security.detectDevTools, submissionId]);

  useEffect(() => {
    if (!submissionId) return;
    if (!security.forceFullscreen) return;

    const requestFullscreen = async () => {
      if (!document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch {
          // ignore request errors
        }
      }
    };
    void requestFullscreen();

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        void emitViolation("fullscreen_exit");
        void requestFullscreen();
      }
    };

    window.addEventListener("fullscreenchange", onFullscreenChange);
    return () => window.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [emitViolation, security.forceFullscreen, submissionId]);

  return {
    deadlineAt,
    warningCount,
    warningLimit,
    warningPopup,
    dismissWarningPopup: () => setWarningPopup(null),
  };
}
