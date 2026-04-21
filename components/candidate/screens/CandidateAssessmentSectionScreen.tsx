"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DOMPurify from "dompurify";
import { AppButton } from "@/components/shared/ui/AppButton";
import {
  saveCandidateDraft,
  submitCandidateTest,
  uploadCandidateCkeditorImage,
} from "@/components/admin/lib/backendApi";
import { usePublicBranding } from "@/components/admin/lib/runtimeSettings";
import { useCandidateRealtimeState } from "@/components/candidate/hooks/useCandidateRealtimeState";
import {
  UiPreviewTaskEditor,
  DEFAULT_REACT_UI_PREVIEW_CODE,
  type UiPreviewAnswer,
} from "@/components/candidate/components/UiPreviewTaskEditor";
import {
  saveCandidateResultSummary,
  saveCandidateSession,
} from "@/components/candidate/lib/candidateSessionStorage";
import { CandidateCountdown } from "@/components/candidate/components/CandidateCountdown";
import { useCandidateSecurityGuard } from "@/components/candidate/security/useCandidateSecurityGuard";
import { calculateMcqScore, calculateMcqTotal } from "@/components/candidate/security/scoring";
import { clearRuntimeState } from "@/components/candidate/security/runtimeStore";
import {
  getRouteAfterAssessment,
  getRouteAfterUiPreview,
  hasAssessmentSections,
  hasUiPreviewSections,
} from "@/components/candidate/lib/assessmentFlow";

const CKEditor = dynamic(
  async () => {
    const mod = await import("@ckeditor/ckeditor5-react");
    return mod.CKEditor;
  },
  { ssr: false }
);

type SectionConfig = {
  index: number;
  key:
    | "short_answer"
    | "long_answer"
    | "scenario"
    | "ui_preview"
    | "portfolio_link"
    | "bug_report"
    | "test_case";
  title: string;
  prompt: string;
  instructions?: string;
  required?: boolean;
};

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px] text-[#d97706]">
      <path d="M12 4L20 18H4L12 4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 9.2V13.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="16.3" r="1" fill="currentColor" />
    </svg>
  );
}

function sectionPlaceholder(key: SectionConfig["key"]) {
  switch (key) {
    case "portfolio_link":
      return "Paste your final Figma design link...";
    case "scenario":
      return "Write your scenario-based response";
    case "ui_preview":
      return "Build this UI using code editor and preview";
    case "long_answer":
      return "Write detailed answer";
    case "short_answer":
      return "Write short answer";
    case "bug_report":
      return "Write bug report / issue analysis";
    case "test_case":
      return "Write test cases / QA approach";
    default:
      return "Write your answer";
  }
}

function parseDesignerUiTaskPrompt(raw: string): {
  taskPrompt: string;
  pdfUrl: string;
  pdfFileName: string;
  figmaReferenceLink: string;
} {
  if (!raw?.trim()) {
    return {
      taskPrompt: "Read the requirement document and complete the design task in Figma.",
      pdfUrl: "",
      pdfFileName: "",
      figmaReferenceLink: "",
    };
  }
  try {
    const parsed = JSON.parse(raw) as {
      taskPrompt?: string;
      pdfUrl?: string;
      pdfFileName?: string;
      figmaReferenceLink?: string;
    };
    return {
      taskPrompt: String(parsed.taskPrompt || "Read the requirement document and complete the design task in Figma."),
      pdfUrl: /^https?:\/\//i.test(String(parsed.pdfUrl || "")) ? String(parsed.pdfUrl || "") : "",
      pdfFileName: String(parsed.pdfFileName || ""),
      figmaReferenceLink: String(parsed.figmaReferenceLink || ""),
    };
  } catch {
    return {
      taskPrompt: raw,
      pdfUrl: "",
      pdfFileName: "",
      figmaReferenceLink: "",
    };
  }
}

const defaultUiPreviewAnswer: UiPreviewAnswer = {
  framework: "react_tailwind",
  html: "<main>\n  <h1>UI Task</h1>\n</main>",
  css: "body { font-family: sans-serif; padding: 20px; }",
  js: "",
  reactCode: DEFAULT_REACT_UI_PREVIEW_CODE,
};

function parseUiPreviewAnswer(raw: string): UiPreviewAnswer {
  if (!raw?.trim()) return defaultUiPreviewAnswer;
  try {
    const parsed = JSON.parse(raw) as Partial<UiPreviewAnswer>;
    return {
      framework: parsed.framework === "html_css_js" ? "html_css_js" : "react_tailwind",
      html: String(parsed.html || defaultUiPreviewAnswer.html),
      css: String(parsed.css || defaultUiPreviewAnswer.css),
      js: String(parsed.js || defaultUiPreviewAnswer.js),
      reactCode: String(parsed.reactCode || defaultUiPreviewAnswer.reactCode),
    };
  } catch {
    return {
      ...defaultUiPreviewAnswer,
      html: raw.includes("<") ? raw : defaultUiPreviewAnswer.html,
    };
  }
}

function parseUiPreviewPrompt(section: SectionConfig): { taskPrompt: string; referenceImageUrl: string } {
  const rawPrompt = String(section.prompt || "");
  try {
    const parsed = JSON.parse(rawPrompt) as { taskPrompt?: string; referenceImageUrl?: string };
    return {
      taskPrompt: String(parsed.taskPrompt || "Recreate the provided UI screen in code."),
      referenceImageUrl: String(parsed.referenceImageUrl || ""),
    };
  } catch {
    const text = `${section.prompt || ""}\n${section.instructions || ""}`;
    const httpMatch = text.match(/https?:\/\/[^\s)]+/i);
    const dataMatch = text.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/i);
    return {
      taskPrompt: rawPrompt || "Recreate the provided UI screen in code.",
      referenceImageUrl: httpMatch?.[0] || dataMatch?.[0] || "",
    };
  }
}

function parseBugReportPrompt(raw: string): { websiteLink: string; description: string; descriptionHtml: string } {
  if (!raw?.trim()) return { websiteLink: "", description: "", descriptionHtml: "<p></p>" };

  try {
    const parsed = JSON.parse(raw) as {
      websiteLink?: string;
      descriptionHtml?: string;
      descriptionText?: string;
      description?: string;
    };
    if (parsed && (parsed.websiteLink || parsed.descriptionHtml || parsed.descriptionText || parsed.description)) {
      const descriptionHtml = String(parsed.descriptionHtml || "").trim();
      const description =
        String(parsed.descriptionText || parsed.description || "").trim() ||
        editorHtmlToPlainText(descriptionHtml);
      return {
        websiteLink: String(parsed.websiteLink || "").trim(),
        description,
        descriptionHtml: descriptionHtml || plainTextToEditorHtml(description),
      };
    }
  } catch {
    // fallback below
  }

  const websiteMatch = raw.match(/^\s*website\s*link\s*:\s*([^\r\n]*)/im);
  const descriptionMatch = raw.match(/^\s*description\s*:\s*([\s\S]*)$/im);
  if (websiteMatch || descriptionMatch) {
    const description = (descriptionMatch?.[1] || "").trim();
    return {
      websiteLink: (websiteMatch?.[1] || "").trim(),
      description,
      descriptionHtml: plainTextToEditorHtml(description),
    };
  }

  const fallback = raw.trim();
  return {
    websiteLink: "",
    description: fallback,
    descriptionHtml: plainTextToEditorHtml(fallback),
  };
}

type ParsedBugReportAnswer = {
  answerText: string;
  answerHtml: string;
};

function parseBugReportAnswer(raw: string): ParsedBugReportAnswer {
  const fallbackText = String(raw || "").trim();
  if (!fallbackText) return { answerText: "", answerHtml: "<p></p>" };

  try {
    const parsed = JSON.parse(raw) as {
      answerText?: string;
      answerHtml?: string;
      answer?: string;
    };
    if (parsed && (parsed.answerText || parsed.answerHtml || parsed.answer)) {
      const answerHtml = String(parsed.answerHtml || "").trim();
      const answerText =
        String(parsed.answerText || parsed.answer || "").trim() ||
        editorHtmlToPlainText(answerHtml);
      return {
        answerText,
        answerHtml: answerHtml || plainTextToEditorHtml(answerText),
      };
    }
  } catch {
    // treat as legacy plain text
  }

  return {
    answerText: fallbackText,
    answerHtml: plainTextToEditorHtml(fallbackText),
  };
}

function serializeBugReportAnswer(answerText: string, answerHtml: string): string {
  const normalizedText = String(answerText || "").trim();
  const normalizedHtml = String(answerHtml || "").trim() || plainTextToEditorHtml(normalizedText);
  return JSON.stringify({
    answerText: normalizedText,
    answerHtml: normalizedHtml,
  });
}

function hasSectionAnswerValue(sectionKey: SectionConfig["key"], raw: string | undefined): boolean {
  if (sectionKey === "bug_report") {
    return parseBugReportAnswer(String(raw || "")).answerText.trim().length > 0;
  }
  return String(raw || "").trim().length > 0;
}

function normalizeSectionAnswerForSave(sectionKey: SectionConfig["key"], raw: string | undefined): string {
  if (sectionKey === "bug_report") {
    const parsed = parseBugReportAnswer(String(raw || ""));
    return serializeBugReportAnswer(parsed.answerText, parsed.answerHtml);
  }
  return String(raw || "");
}

function editorHtmlToPlainText(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined") {
    return html
      .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim();
  }
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.innerText
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function plainTextToEditorHtml(text: string): string {
  const value = String(text || "").trim();
  if (!value) return "<p></p>";
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return escaped
    .split("\n")
    .map((line) => `<p>${line || "&nbsp;"}</p>`)
    .join("");
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

type CandidateAssessmentSectionScreenProps = {
  mode?: "assessment" | "ui_preview";
};

export function CandidateAssessmentSectionScreen({ mode = "assessment" }: CandidateAssessmentSectionScreenProps) {
  const router = useRouter();
  const branding = usePublicBranding();
  const [isHydrated, setIsHydrated] = useState(false);
  const [editorConstructor, setEditorConstructor] = useState<unknown>(null);
  const bugReportAnswerHtmlDraftRef = useRef<Record<number, string>>({});
  const [bugReportImageUploadingBySection, setBugReportImageUploadingBySection] = useState<Record<number, boolean>>({});
  const [bugReportImageUploadErrorBySection, setBugReportImageUploadErrorBySection] = useState<Record<number, string>>({});
  const { session } = useCandidateRealtimeState();

  const uploadCkeditorImage = async (file: File) => {
    if (!session?.submissionId || !session?.candidateSessionToken) {
      throw new Error("Candidate session missing. Please login again.");
    }
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed.");
    }
    if (file.size > 2_000_000) {
      throw new Error("Image is too large. Use image up to 2MB.");
    }
    const dataUrl = await readFileAsDataUrl(file);
    const uploaded = await uploadCandidateCkeditorImage({
      submissionId: session.submissionId,
      candidateSessionToken: session.candidateSessionToken,
      dataUrl,
      fileName: file.name,
    });
    if (!/^https?:\/\//i.test(String(uploaded.url || ""))) {
      throw new Error("Invalid image URL returned by upload service.");
    }
    return uploaded.url;
  };

  const formatCkeditorUploadError = (error: unknown): string => {
    const raw = error instanceof Error ? error.message : "Failed to upload image.";
    const lower = raw.toLowerCase();
    if (lower.includes("route not found")) {
      return "Image upload endpoint not found. Please refresh and retry.";
    }
    if (lower.includes("session missing") || lower.includes("unauthorized")) {
      return "Session expired. Please login again.";
    }
    if (lower.includes("too large")) {
      return "Image is too large. Max size is 2MB.";
    }
    if (lower.includes("only image")) {
      return "Only JPG, PNG, WebP image files are supported.";
    }
    return raw;
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    void import("@ckeditor/ckeditor5-build-classic")
      .then((mod) => {
        if (mounted) setEditorConstructor(() => mod.default);
      })
      .catch(() => {
        if (mounted) setEditorConstructor(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const allConfigs = useMemo<SectionConfig[]>(() => {
    const all = session?.test?.sectionConfigs || [];
    const enabled = new Set((session?.test?.enabledSections || []).map((v) => String(v)));
    if (all.length > 0) {
      // Prefer server-provided section configs. If enabledSections is stale/missing,
      // do not hide valid configured sections.
      if (enabled.size === 0) return all;
      const filtered = all.filter((item) => enabled.has(item.key));
      return filtered.length > 0 ? filtered : all;
    }

    const fallbackKeys: SectionConfig["key"][] = [
      "ui_preview",
      "short_answer",
      "long_answer",
      "scenario",
      "portfolio_link",
      "bug_report",
      "test_case",
    ];
    return fallbackKeys
      .filter((key) => enabled.has(key))
      .map((key, index) => ({
        index,
        key,
        title:
          key === "portfolio_link"
            ? "Portfolio/Link"
            : key
                .split("_")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" "),
        prompt: sectionPlaceholder(key),
        instructions: "",
        required: true,
      }));
  }, [session]);

  const configs = useMemo<SectionConfig[]>(() => {
    if (mode === "ui_preview") {
      return allConfigs.filter((item) => item.key === "ui_preview");
    }
    return allConfigs.filter((item) => item.key !== "ui_preview");
  }, [allConfigs, mode]);

  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const existing = session?.sectionAnswers || [];
    return existing.reduce<Record<number, string>>((acc, item) => {
      acc[item.itemIndex] = item.answer;
      return acc;
    }, {});
  });
  const [uiPreviewAnswers, setUiPreviewAnswers] = useState<Record<number, UiPreviewAnswer>>(() => {
    const existing = session?.sectionAnswers || [];
    return existing.reduce<Record<number, UiPreviewAnswer>>((acc, item) => {
      if (item.sectionKey !== "ui_preview") return acc;
      acc[item.itemIndex] = parseUiPreviewAnswer(item.answer || "");
      return acc;
    }, {});
  });

  useEffect(() => {
    const existing = session?.sectionAnswers || [];
    const nextAnswers = existing.reduce<Record<number, string>>((acc, item) => {
      acc[item.itemIndex] = item.answer;
      return acc;
    }, {});
    const nextUiAnswers = existing.reduce<Record<number, UiPreviewAnswer>>((acc, item) => {
      if (item.sectionKey !== "ui_preview") return acc;
      acc[item.itemIndex] = parseUiPreviewAnswer(item.answer || "");
      return acc;
    }, {});

    setAnswers((prev) => {
      const prevSerialized = JSON.stringify(prev);
      const nextSerialized = JSON.stringify(nextAnswers);
      return prevSerialized === nextSerialized ? prev : nextAnswers;
    });
    setUiPreviewAnswers((prev) => {
      const prevSerialized = JSON.stringify(prev);
      const nextSerialized = JSON.stringify(nextUiAnswers);
      return prevSerialized === nextSerialized ? prev : nextUiAnswers;
    });
  }, [session?.submissionId]);

  useEffect(() => {
    if (!session?.submissionId || !session?.candidateSessionToken) return;
    const sectionAnswers = allConfigs.map((config) => ({
      sectionKey: config.key,
      itemIndex: config.index,
      answer: normalizeSectionAnswerForSave(config.key, answers[config.index]),
    }));
    const currentSerialized = JSON.stringify(session.sectionAnswers || []);
    const nextSerialized = JSON.stringify(sectionAnswers);
    if (currentSerialized === nextSerialized) return;
    saveCandidateSession({
      ...session,
      sectionAnswers,
    });
  }, [
    allConfigs,
    answers,
    session?.submissionId,
    session?.candidateSessionToken,
    session,
  ]);

  useEffect(() => {
    if (!configs.length) return;
    const uiConfigs = configs.filter((cfg) => cfg.key === "ui_preview");
    if (!uiConfigs.length) return;

    setUiPreviewAnswers((prev) => {
      const next = { ...prev };
      let changed = false;
      uiConfigs.forEach((cfg) => {
        if (next[cfg.index]) return;
        next[cfg.index] = defaultUiPreviewAnswer;
        changed = true;
      });
      return changed ? next : prev;
    });

    setAnswers((prev) => {
      const next = { ...prev };
      let changed = false;
      uiConfigs.forEach((cfg) => {
        if (String(next[cfg.index] || "").trim()) return;
        next[cfg.index] = JSON.stringify(defaultUiPreviewAnswer);
        changed = true;
      });
      return changed ? next : prev;
    });
  }, [configs]);

  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState("");
  const assessmentPages = useMemo(() => {
    if (mode === "ui_preview") {
      return [configs];
    }
    const portfolio = configs.filter((section) => section.key === "portfolio_link");
    const others = configs.filter((section) => section.key !== "portfolio_link");
    if (portfolio.length > 0) {
      return others.length > 0 ? [others, portfolio] : [portfolio];
    }
    return [others];
  }, [configs, mode]);
  const currentSections = assessmentPages[currentPage] || [];
  const totalPages = Math.max(assessmentPages.length, 1);
  const isDesignerUiTaskPage =
    mode === "assessment" &&
    session?.test?.roleCategory === "designer" &&
    currentSections.length > 0 &&
    currentSections.every((section) => section.key === "portfolio_link");
  const isQaManualBugReportPage =
    mode === "assessment" &&
    session?.test?.roleCategory === "qa_manual" &&
    currentSections.length > 0 &&
    currentSections.every((section) => section.key === "bug_report");
  const finalActionLabel = useMemo(() => {
    if (!session) return "Continue";
    const nextRoute = mode === "ui_preview" ? getRouteAfterUiPreview(session) : getRouteAfterAssessment(session);
    if (nextRoute === "/candidate/tasks") return "Continue to Coding";
    if (nextRoute === "/candidate/submitted") return "Submit Test";
    return "Continue";
  }, [mode, session]);
  const pageTitle =
    mode === "ui_preview"
      ? "UI Preview Task"
      : isDesignerUiTaskPage
        ? "UI Task"
        : isQaManualBugReportPage
          ? "Bug Report Task"
        : "Assessment Questions";

  const effectiveSecurity = useMemo(() => {
    const base = session?.test?.security || {};
    if (!isDesignerUiTaskPage && !isQaManualBugReportPage) return base;
    return {
      ...base,
      forceFullscreen: false,
      disableTabSwitch: false,
      autoEndOnTabChange: false,
      disableCopyPaste: false,
      disableRightClick: false,
      detectDevTools: false,
    };
  }, [isDesignerUiTaskPage, isQaManualBugReportPage, session?.test?.security]);

  const { deadlineAt, warningCount, warningPopup, dismissWarningPopup } = useCandidateSecurityGuard({
    submissionId: session?.submissionId || "",
    candidateSessionToken: session?.candidateSessionToken || "",
    durationMinutes: session?.test?.durationMinutes || 90,
    security: effectiveSecurity,
    onAutoSubmit: async (reason) => {
      if (!session?.submissionId || !session.candidateSessionToken) return;
      const mcqAnswers = session.mcqAnswers || [];
      const sectionAnswers = allConfigs.map((config) => ({
        sectionKey: config.key,
        itemIndex: config.index,
        answer: normalizeSectionAnswerForSave(config.key, answers[config.index]),
      }));
      const response = await submitCandidateTest({
        submissionId: session.submissionId,
        candidateSessionToken: session.candidateSessionToken,
        mcqAnswers,
        codingAnswers: [],
        sectionAnswers,
        auto: true,
        endedReason: reason,
      });
      const mcqTotal = calculateMcqTotal(session.test.mcqQuestions || []);
      const mcqScore = calculateMcqScore(session.test.mcqQuestions || [], mcqAnswers);
      saveCandidateResultSummary({
        submissionId: session.submissionId,
        mcqScore: Number.isFinite(Number(response.submission?.mcqScore))
          ? Number(response.submission.mcqScore)
          : mcqScore,
        mcqTotal: Number.isFinite(Number(response.submission?.mcqTotal))
          ? Number(response.submission.mcqTotal)
          : mcqTotal,
        submittedAt: new Date().toISOString(),
        codingEvaluation: { status: "not_required", totalMarks: 0, maxMarks: 0 },
      });
      clearRuntimeState(session.submissionId);
      router.push("/candidate/submitted");
    },
  });

  useEffect(() => {
    if (!session) return;

    if (mode === "ui_preview") {
      if (hasUiPreviewSections(session)) return;
      if (hasAssessmentSections(session)) {
        router.push("/candidate/assessment");
        return;
      }
      router.push(getRouteAfterUiPreview(session));
      return;
    }

    if (hasAssessmentSections(session)) return;
    router.push(getRouteAfterAssessment(session));
  }, [mode, router, session]);

  if (!isHydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 text-center">
          <p className="text-base text-[#475569]">Loading assessment...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 text-center">
          <p className="text-base text-[#475569]">Session not found. Please login again.</p>
          <AppButton className="mt-4" onClick={() => router.push("/candidate")}>Go To Candidate Login</AppButton>
        </div>
      </main>
    );
  }

  async function handleContinue() {
    if (!session) {
      router.push("/candidate");
      return;
    }
    setError("");
    const missing = configs.filter(
      (cfg) => cfg.required !== false && !hasSectionAnswerValue(cfg.key, answers[cfg.index])
    );
    if (missing.length) {
      setError(`Please fill required fields: ${missing.map((m) => m.title).join(", ")}`);
      return;
    }

    const sectionAnswers = allConfigs.map((config) => ({
      sectionKey: config.key,
      itemIndex: config.index,
      answer: normalizeSectionAnswerForSave(config.key, answers[config.index]),
    }));

    try {
      await saveCandidateDraft({
        submissionId: session.submissionId,
        candidateSessionToken: session.candidateSessionToken,
        mcqAnswers: session.mcqAnswers || [],
        sectionAnswers,
      });
      saveCandidateSession({ ...session, sectionAnswers });

      const nextRoute = mode === "ui_preview" ? getRouteAfterUiPreview(session) : getRouteAfterAssessment(session);
      if (nextRoute === "/candidate/tasks") {
        router.push(nextRoute);
        return;
      }

      const response = await submitCandidateTest({
        submissionId: session.submissionId,
        candidateSessionToken: session.candidateSessionToken,
        mcqAnswers: session.mcqAnswers || [],
        codingAnswers: [],
        sectionAnswers,
      });

      const mcqTotal = calculateMcqTotal(session.test.mcqQuestions || []);
      const mcqScore = calculateMcqScore(session.test.mcqQuestions || [], session.mcqAnswers || []);
      saveCandidateResultSummary({
        submissionId: session.submissionId,
        mcqScore: Number.isFinite(Number(response.submission?.mcqScore))
          ? Number(response.submission.mcqScore)
          : mcqScore,
        mcqTotal: Number.isFinite(Number(response.submission?.mcqTotal))
          ? Number(response.submission.mcqTotal)
          : mcqTotal,
        submittedAt: new Date().toISOString(),
        codingEvaluation: { status: "not_required", totalMarks: 0, maxMarks: 0 },
      });
      clearRuntimeState(session.submissionId);
      router.push("/candidate/submitted");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to save answers";
      setError(message);
    }
  }

  function getMissingRequiredInSections(sections: SectionConfig[]) {
    return sections.filter(
      (section) => section.required !== false && !hasSectionAnswerValue(section.key, answers[section.index])
    );
  }

  function handleNextSection() {
    if (!currentSections.length) return;
    const missing = getMissingRequiredInSections(currentSections);
    if (missing.length > 0) {
      setError(`Please fill required fields: ${missing.map((item) => item.title).join(", ")}`);
      return;
    }
    setError("");
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  }

  function handlePreviousSection() {
    setError("");
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  }

  return (
    <main
      className={`min-h-screen ${
        mode === "ui_preview"
          ? "bg-[radial-gradient(circle_at_top_left,_#eef4ff_0%,_#f8fbff_45%,_#f3f7ff_100%)]"
          : "bg-[#f8fafc]"
      }`}
    >
      <section
        className={`mx-auto w-full pb-8 pt-10 ${
          mode === "ui_preview"
            ? "max-w-[1820px] px-4 sm:px-6 lg:px-10"
            : "max-w-[1084px] px-4 sm:px-6 lg:px-8"
        }`}
      >
        <article
          className={`overflow-hidden border bg-white ${
            mode === "ui_preview"
              ? "rounded-[20px] border-[#d9e3ff]"
              : "rounded-[24px] border-[#e2e8f0]"
          }`}
        >
          <header
            className={`flex items-center justify-between border-b px-6 py-4 ${
              mode === "ui_preview"
                ? "border-[#d9e3ff] bg-[linear-gradient(90deg,#eef3ff_0%,#f8faff_100%)]"
                : "border-[#e2e8f0] bg-[#f8fafc]"
            }`}
          >
            <div>
              <h1 className="text-[24px] font-semibold text-[#0f172a]">
                {pageTitle}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm text-[#64748b]">{branding.companyName || "Techforge Innovation"}</p>
                {mode === "ui_preview" ? (
                  <span className="rounded-full bg-[#e8efff] px-2.5 py-1 text-xs font-semibold text-[#1f3a8a]">
                    Frontend Challenge
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`flex h-[44px] items-center rounded-[10px] border px-3 ${
                  mode === "ui_preview"
                    ? "border-[#bfceff] bg-white shadow-[0_4px_14px_rgba(31,58,138,0.1)]"
                    : "border-[#dbe4ff] bg-white"
                }`}
              >
                <CandidateCountdown deadlineAt={deadlineAt} className="text-[16px] font-semibold text-[#0f172a]" />
              </div>
              {!isDesignerUiTaskPage && !isQaManualBugReportPage ? (
                <div className="flex h-[44px] items-center gap-2 rounded-[10px] border border-[#ffd8aa] bg-[#fff2e4] px-3">
                  <WarningIcon />
                  <p className="text-sm font-semibold text-[#d97706]">{warningCount} Warning{warningCount === 1 ? "" : "s"}</p>
                </div>
              ) : null}
            </div>
          </header>

          <div className={`space-y-5 px-6 py-6 ${mode === "ui_preview" ? "lg:px-8 lg:py-8" : ""}`}>
            {currentSections.length ? (
              <section
                className={`space-y-4 border bg-white ${
                  mode === "ui_preview"
                    ? "rounded-[14px] border-[#e5ebff] p-4"
                    : "rounded-[12px] border-[#e2e8f0] p-4"
                }`}
              >
                {currentSections.map((section, itemIndex) => (
                  <div
                    key={`${section.key}-${section.index}`}
                    className={itemIndex > 0 ? `border-t pt-4 ${mode === "ui_preview" ? "border-[#dfe7ff]" : "border-[#e2e8f0]"}` : ""}
                  >
                    {(() => {
                      const designerPrompt =
                        section.key === "portfolio_link" && session?.test?.roleCategory === "designer"
                          ? parseDesignerUiTaskPrompt(section.prompt || "")
                          : null;
                      return (
                        <>
                    <h2 className={`font-semibold text-[#0f172a] ${mode === "ui_preview" ? "text-[28px]" : "text-[24px]"}`}>
                      {section.index + 1}. {section.title}
                    </h2>
                    {section.prompt && section.key !== "bug_report" ? (
                      <p className={`mt-1 text-[#475569] ${mode === "ui_preview" ? "text-[15px]" : "text-sm"}`}>
                        {section.key === "ui_preview"
                          ? parseUiPreviewPrompt(section).taskPrompt
                          : designerPrompt
                            ? designerPrompt.taskPrompt
                            : section.prompt}
                      </p>
                    ) : null}
                    {section.instructions ? <p className="mt-1 text-xs text-[#64748b]">{section.instructions}</p> : null}
                    {designerPrompt ? (
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {designerPrompt.pdfUrl ? (
                          <a
                            href={designerPrompt.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-[48px] items-center justify-center rounded-[8px] border border-[#1f3a8a] bg-[#eef2ff] px-4 text-sm font-medium text-[#1f3a8a]"
                          >
                            {designerPrompt.pdfFileName || "Open Requirement PDF"}
                          </a>
                        ) : (
                          <div className="inline-flex h-[48px] items-center justify-center rounded-[8px] border border-[#dbe3ef] bg-[#f8fafc] px-4 text-sm text-[#64748b]">
                            Requirement PDF not attached
                          </div>
                        )}
                        {designerPrompt.figmaReferenceLink ? (
                          <a
                            href={designerPrompt.figmaReferenceLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-[48px] items-center justify-center rounded-[8px] border border-[#1f3a8a] bg-white px-4 text-sm font-medium text-[#1f3a8a]"
                          >
                            Open Figma Link
                          </a>
                        ) : (
                          <div className="inline-flex h-[48px] items-center justify-center rounded-[8px] border border-[#dbe3ef] bg-[#f8fafc] px-4 text-sm text-[#64748b]">
                            Figma link not attached
                          </div>
                        )}
                      </div>
                    ) : null}
                    {section.key === "bug_report" ? (
                      <div className="mt-3 space-y-3">
                        {(() => {
                          const parsedBug = parseBugReportPrompt(section.prompt || "");
                          const parsedBugAnswer = parseBugReportAnswer(answers[section.index] || "");
                          const candidateAnswer = parsedBugAnswer.answerText;
                          const editorHtml =
                            bugReportAnswerHtmlDraftRef.current[section.index] ?? parsedBugAnswer.answerHtml;
                          const bugUploading = Boolean(bugReportImageUploadingBySection[section.index]);
                          const bugUploadError = bugReportImageUploadErrorBySection[section.index] || "";

                          return (
                            <>
                              <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Website Link</p>
                                {parsedBug.websiteLink ? (
                                  <a
                                    href={parsedBug.websiteLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-block break-all text-[15px] font-medium text-[#1f3a8a] underline underline-offset-2"
                                  >
                                    {parsedBug.websiteLink}
                                  </a>
                                ) : (
                                  <p className="mt-1 text-[14px] text-[#64748b]">No website link provided.</p>
                                )}
                              </div>
                              <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
                                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Description</p>
                                <div
                                  className="bug-report-render mt-2 text-[14px] leading-6 text-[#334155]"
                                  dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(
                                      parsedBug.descriptionHtml || plainTextToEditorHtml(parsedBug.description || "No description provided.")
                                    ),
                                  }}
                                />
                              </div>
                              <div className="qa-bug-ckeditor rounded-[10px] border border-[#dbe3ef] bg-white">
                                <p className="mb-2 px-3 pt-3 text-base font-semibold text-[#1e293b]">Your Bug Report</p>
                                {editorConstructor ? (
                                  <CKEditor
                                    editor={editorConstructor as never}
                                    key={`candidate-bug-editor-${section.index}`}
                                    data={editorHtml}
                                    onChange={(_event, editor) => {
                                      const draftHtml = editor.getData();
                                      bugReportAnswerHtmlDraftRef.current[section.index] = draftHtml;
                                      const draftPlain = editorHtmlToPlainText(draftHtml);
                                      setAnswers((prev) => ({
                                        ...prev,
                                        [section.index]: serializeBugReportAnswer(draftPlain, draftHtml),
                                      }));
                                    }}
                                    onBlur={() => {
                                      const draftHtml = bugReportAnswerHtmlDraftRef.current[section.index];
                                      if (typeof draftHtml !== "string") return;
                                      const draftPlain = editorHtmlToPlainText(draftHtml);
                                      setAnswers((prev) => ({
                                        ...prev,
                                        [section.index]: serializeBugReportAnswer(draftPlain, draftHtml),
                                      }));
                                    }}
                                    config={{
                                      placeholder: "Write your bug findings, reproduction steps, expected/actual behavior, and priority.",
                                      toolbar: [
                                        "undo",
                                        "redo",
                                        "|",
                                        "bold",
                                        "italic",
                                        "bulletedList",
                                        "numberedList",
                                        "|",
                                        "link",
                                        "insertTable",
                                        "uploadImage",
                                      ],
                                      image: {
                                        toolbar: [
                                          "imageTextAlternative",
                                          "|",
                                          "imageStyle:inline",
                                          "imageStyle:block",
                                          "imageStyle:side",
                                          "|",
                                          "resizeImage:25",
                                          "resizeImage:50",
                                          "resizeImage:75",
                                          "resizeImage:original",
                                        ],
                                        resizeOptions: [
                                          { name: "resizeImage:original", value: null, label: "Original" },
                                          { name: "resizeImage:25", value: "25", label: "25%" },
                                          { name: "resizeImage:50", value: "50", label: "50%" },
                                          { name: "resizeImage:75", value: "75", label: "75%" },
                                        ],
                                      },
                                    }}
                                    onReady={(editor) => {
                                      try {
                                        type Loader = { file: Promise<File> };
                                        type UploadAdapter = {
                                          upload: () => Promise<{ default: string }>;
                                          abort: () => void;
                                        };
                                        type FileRepositoryPlugin = {
                                          createUploadAdapter?: (loader: Loader) => UploadAdapter;
                                        };
                                        const fileRepository = (
                                          editor as unknown as {
                                            plugins: { get: (name: string) => FileRepositoryPlugin };
                                          }
                                        ).plugins.get("FileRepository");
                                        if (!fileRepository) return;
                                        fileRepository.createUploadAdapter = (loader: Loader) => ({
                                          upload: async () => {
                                            setBugReportImageUploadErrorBySection((prev) => {
                                              const next = { ...prev };
                                              delete next[section.index];
                                              return next;
                                            });
                                            setBugReportImageUploadingBySection((prev) => ({ ...prev, [section.index]: true }));
                                            try {
                                              const file = await loader.file;
                                              const url = await uploadCkeditorImage(file);
                                              return { default: url };
                                            } catch (error) {
                                              const message = formatCkeditorUploadError(error);
                                              setBugReportImageUploadErrorBySection((prev) => ({
                                                ...prev,
                                                [section.index]: message,
                                              }));
                                              throw error;
                                            } finally {
                                              setBugReportImageUploadingBySection((prev) => {
                                                const next = { ...prev };
                                                delete next[section.index];
                                                return next;
                                              });
                                            }
                                          },
                                          abort: () => {},
                                        });
                                      } catch {
                                        // Keep editor usable even if upload adapter cannot bind.
                                      }
                                    }}
                                  />
                                ) : (
                                  <textarea
                                    value={candidateAnswer}
                                    onChange={(event) => {
                                      const nextText = event.target.value;
                                      setAnswers((prev) => ({
                                        ...prev,
                                        [section.index]: serializeBugReportAnswer(nextText, plainTextToEditorHtml(nextText)),
                                      }));
                                    }}
                                    className="h-[220px] w-full resize-none rounded-[8px] border border-[#dbe3ef] bg-white px-3 py-3 text-[15px] text-[#0f172a] outline-none placeholder:text-[#98a2b3] focus:border-[#1f3a8a]"
                                    placeholder="Write your bug findings, reproduction steps, expected/actual behavior, and priority."
                                  />
                                )}
                                {bugUploading ? (
                                  <p className="px-3 pb-2 text-[12px] text-[#1f3a8a]">Uploading image...</p>
                                ) : null}
                                {bugUploadError ? (
                                  <p className="px-3 pb-2 text-[12px] text-red-600">{bugUploadError}</p>
                                ) : null}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : section.key === "scenario" || section.key === "long_answer" || section.key === "test_case" ? (
                      <textarea
                        value={answers[section.index] || ""}
                        onChange={(event) => setAnswers((prev) => ({ ...prev, [section.index]: event.target.value }))}
                        placeholder={sectionPlaceholder(section.key)}
                        className="mt-3 h-[180px] w-full resize-none rounded-[8px] border border-[#dbe3ef] bg-white px-3 py-3 text-[15px] text-[#0f172a] outline-none placeholder:text-[#98a2b3] focus:border-[#1f3a8a]"
                      />
                    ) : section.key === "ui_preview" ? (
                      <div className="mt-3">
                        <UiPreviewTaskEditor
                          value={uiPreviewAnswers[section.index] || defaultUiPreviewAnswer}
                          onChange={(next) => {
                            setUiPreviewAnswers((prev) => ({ ...prev, [section.index]: next }));
                            setAnswers((prev) => ({
                              ...prev,
                              [section.index]: JSON.stringify(next),
                            }));
                          }}
                          referenceImageUrl={parseUiPreviewPrompt(section).referenceImageUrl}
                        />
                      </div>
                    ) : (
                      <input
                        value={answers[section.index] || ""}
                        onChange={(event) => setAnswers((prev) => ({ ...prev, [section.index]: event.target.value }))}
                        placeholder={sectionPlaceholder(section.key)}
                        className="mt-3 h-[52px] w-full rounded-[8px] border border-[#dbe3ef] bg-white px-3 text-[15px] text-[#0f172a] outline-none placeholder:text-[#98a2b3] focus:border-[#1f3a8a]"
                      />
                    )}
                        </>
                      );
                    })()}
                  </div>
                ))}
              </section>
            ) : (
              <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-4 text-[#475569]">
                No assessment sections configured.
              </section>
            )}

            <div
              className={`flex items-center justify-between rounded-[14px] ${
                mode === "ui_preview" ? "bg-[#f8faff] px-2 py-2" : ""
              }`}
            >
              <p className="text-sm text-[#64748b]">
                Page {Math.min(currentPage + 1, totalPages)} of {totalPages}
              </p>
              <div className="flex items-center gap-3">
                {currentPage > 0 ? (
                  <AppButton variant="secondary" size="lg" className="min-w-[140px] rounded-[10px]" onClick={handlePreviousSection}>
                    Previous
                  </AppButton>
                ) : null}
                {currentPage < totalPages - 1 ? (
                  <AppButton size="lg" className="min-w-[140px] rounded-[10px]" onClick={handleNextSection}>
                    Next
                  </AppButton>
                ) : (
                  <AppButton size="lg" className="min-w-[190px] rounded-[10px]" onClick={handleContinue}>
                    {finalActionLabel}
                  </AppButton>
                )}
              </div>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </article>
      </section>

      {!isDesignerUiTaskPage && !isQaManualBugReportPage && warningPopup ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/55 px-4">
          <div className="w-full max-w-[460px] rounded-[12px] border border-[#f5c172] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.26)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[#fff2e4] p-2 text-[#d97706]">
                <WarningIcon />
              </div>
              <div className="flex-1">
                <h3 className="text-[22px] font-semibold text-[#0f172a] [zoom:0.7]">{warningPopup.title}</h3>
                <p className="mt-2 text-sm text-[#475569]">{warningPopup.message}</p>
                <p className="mt-3 text-sm font-semibold text-[#d97706]">
                  Warning {warningPopup.warningCount} of {warningPopup.warningLimit}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <AppButton type="button" variant="primary" className="h-10 rounded-[8px] px-5" onClick={dismissWarningPopup}>
                OK
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
