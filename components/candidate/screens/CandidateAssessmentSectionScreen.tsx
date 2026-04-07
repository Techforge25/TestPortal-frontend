"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/shared/ui/AppButton";
import { saveCandidateDraft, submitCandidateTest } from "@/components/admin/lib/backendApi";
import { usePublicBranding } from "@/components/admin/lib/runtimeSettings";
import {
  readCandidateSession,
  saveCandidateResultSummary,
  saveCandidateSession,
} from "@/components/candidate/lib/candidateSessionStorage";
import { CandidateCountdown } from "@/components/candidate/components/CandidateCountdown";
import { useCandidateSecurityGuard } from "@/components/candidate/security/useCandidateSecurityGuard";
import { calculateMcqScore, calculateMcqTotal } from "@/components/candidate/security/scoring";
import { clearRuntimeState } from "@/components/candidate/security/runtimeStore";
import { getRouteAfterAssessment, hasNonCodingSections } from "@/components/candidate/lib/assessmentFlow";

type SectionConfig = {
  index: number;
  key: "short_answer" | "long_answer" | "scenario" | "portfolio_link" | "bug_report" | "test_case";
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
      return "https://...";
    case "scenario":
      return "Write your scenario-based response";
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

export function CandidateAssessmentSectionScreen() {
  const router = useRouter();
  const branding = usePublicBranding();
  const session = useMemo(() => readCandidateSession(), []);

  const configs = useMemo<SectionConfig[]>(() => {
    const all = session?.test?.sectionConfigs || [];
    const enabled = new Set((session?.test?.enabledSections || []).map((v) => String(v)));
    const filtered = all.filter((item) => enabled.has(item.key));
    if (filtered.length > 0) return filtered;

    const fallbackKeys: SectionConfig["key"][] = [
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

  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const existing = session?.sectionAnswers || [];
    return existing.reduce<Record<number, string>>((acc, item) => {
      acc[item.itemIndex] = item.answer;
      return acc;
    }, {});
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState("");
  const assessmentPages = useMemo(() => {
    const portfolio = configs.filter((section) => section.key === "portfolio_link");
    const others = configs.filter((section) => section.key !== "portfolio_link");
    return portfolio.length > 0 ? [others, portfolio] : [others];
  }, [configs]);
  const currentSections = assessmentPages[currentPage] || [];
  const totalPages = Math.max(assessmentPages.length, 1);
  const isPortfolioOnlyPage =
    currentSections.length > 0 &&
    currentSections.every((section) => section.key === "portfolio_link");

  const effectiveSecurity = useMemo(() => {
    const base = session?.test?.security || {};
    if (!isPortfolioOnlyPage) return base;
    return {
      ...base,
      forceFullscreen: false,
      disableTabSwitch: false,
      autoEndOnTabChange: false,
      disableCopyPaste: false,
      disableRightClick: false,
      detectDevTools: false,
    };
  }, [isPortfolioOnlyPage, session?.test?.security]);

  const { deadlineAt, warningCount, warningPopup, dismissWarningPopup } = useCandidateSecurityGuard({
    submissionId: session?.submissionId || "",
    candidateSessionToken: session?.candidateSessionToken || "",
    durationMinutes: session?.test?.durationMinutes || 90,
    security: effectiveSecurity,
    onAutoSubmit: async (reason) => {
      if (!session?.submissionId || !session.candidateSessionToken) return;
      const mcqAnswers = session.mcqAnswers || [];
      const sectionAnswers = configs.map((config) => ({
        sectionKey: config.key,
        itemIndex: config.index,
        answer: answers[config.index] || "",
      }));
      await submitCandidateTest({
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
        mcqScore,
        mcqTotal,
        submittedAt: new Date().toISOString(),
        codingEvaluation: { status: "not_required", totalMarks: 0, maxMarks: 0 },
      });
      clearRuntimeState(session.submissionId);
      router.push("/candidate/submitted");
    },
  });

  useEffect(() => {
    if (!session) return;
    if (hasNonCodingSections(session)) return;
    router.push(getRouteAfterAssessment(session));
  }, [router, session]);

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
    const missing = configs.filter((cfg) => cfg.required !== false && !String(answers[cfg.index] || "").trim());
    if (missing.length) {
      setError(`Please fill required fields: ${missing.map((m) => m.title).join(", ")}`);
      return;
    }

    const sectionAnswers = configs.map((config) => ({
      sectionKey: config.key,
      itemIndex: config.index,
      answer: String(answers[config.index] || ""),
    }));

    try {
      await saveCandidateDraft({
        submissionId: session.submissionId,
        candidateSessionToken: session.candidateSessionToken,
        mcqAnswers: session.mcqAnswers || [],
        sectionAnswers,
      });
      saveCandidateSession({ ...session, sectionAnswers });

      const nextRoute = getRouteAfterAssessment(session);
      if (nextRoute === "/candidate/tasks") {
        router.push(nextRoute);
        return;
      }

      await submitCandidateTest({
        submissionId: session.submissionId,
        candidateSessionToken: session.candidateSessionToken,
        mcqAnswers: session.mcqAnswers || [],
        codingAnswers: [],
        sectionAnswers,
      });

      const mcqTotal = calculateMcqTotal(session.test.mcqQuestions || []);
      const mcqScore = calculateMcqScore(session.test.mcqQuestions || [], session.mcqAnswers || []);
      saveCandidateResultSummary({
        mcqScore,
        mcqTotal,
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
    return sections.filter((section) => section.required !== false && !String(answers[section.index] || "").trim());
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
    <main className="min-h-screen bg-[#f8fafc]">
      <section className="mx-auto w-full max-w-[1084px] px-4 pb-8 pt-10 sm:px-6 lg:px-8">
        <article className="overflow-hidden rounded-[24px] border border-[#e2e8f0] bg-white">
          <header className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#f8fafc] px-6 py-4">
            <div>
              <h1 className="text-[24px] font-semibold text-[#0f172a]">Assessment Questions</h1>
              <p className="text-sm text-[#64748b]">{branding.companyName || "Techforge Innovation"}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-[44px] items-center rounded-[8px] border border-[#dbe4ff] bg-white px-3">
                <CandidateCountdown deadlineAt={deadlineAt} className="text-[16px] font-semibold text-[#0f172a]" />
              </div>
              {!isPortfolioOnlyPage ? (
                <div className="flex h-[44px] items-center gap-2 rounded-[8px] bg-[#fff2e4] px-3">
                  <WarningIcon />
                  <p className="text-sm font-semibold text-[#d97706]">{warningCount} Warning{warningCount === 1 ? "" : "s"}</p>
                </div>
              ) : null}
            </div>
          </header>

          <div className="space-y-5 px-6 py-6">
            {currentSections.length ? (
              <section className="space-y-4 rounded-[12px] border border-[#e2e8f0] bg-white p-4">
                {currentSections.map((section, itemIndex) => (
                  <div key={`${section.key}-${section.index}`} className={itemIndex > 0 ? "border-t border-[#e2e8f0] pt-4" : ""}>
                    <h2 className="text-[24px] font-semibold text-[#0f172a]">
                      {section.index + 1}. {section.title}
                    </h2>
                    {section.prompt ? <p className="mt-1 text-sm text-[#475569]">{section.prompt}</p> : null}
                    {section.instructions ? <p className="mt-1 text-xs text-[#64748b]">{section.instructions}</p> : null}
                    {section.key === "scenario" || section.key === "long_answer" || section.key === "bug_report" || section.key === "test_case" ? (
                      <textarea
                        value={answers[section.index] || ""}
                        onChange={(event) => setAnswers((prev) => ({ ...prev, [section.index]: event.target.value }))}
                        placeholder={sectionPlaceholder(section.key)}
                        className="mt-3 h-[180px] w-full resize-none rounded-[8px] border border-[#dbe3ef] bg-white px-3 py-3 text-[15px] text-[#0f172a] outline-none placeholder:text-[#98a2b3] focus:border-[#1f3a8a]"
                      />
                    ) : (
                      <input
                        value={answers[section.index] || ""}
                        onChange={(event) => setAnswers((prev) => ({ ...prev, [section.index]: event.target.value }))}
                        placeholder={sectionPlaceholder(section.key)}
                        className="mt-3 h-[52px] w-full rounded-[8px] border border-[#dbe3ef] bg-white px-3 text-[15px] text-[#0f172a] outline-none placeholder:text-[#98a2b3] focus:border-[#1f3a8a]"
                      />
                    )}
                  </div>
                ))}
              </section>
            ) : (
              <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-4 text-[#475569]">
                No assessment sections configured.
              </section>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-[#64748b]">
                Page {Math.min(currentPage + 1, totalPages)} of {totalPages}
              </p>
              <div className="flex items-center gap-3">
                {currentPage > 0 ? (
                  <AppButton variant="secondary" size="lg" className="min-w-[140px]" onClick={handlePreviousSection}>
                    Previous
                  </AppButton>
                ) : null}
                {currentPage < totalPages - 1 ? (
                  <AppButton size="lg" className="min-w-[140px]" onClick={handleNextSection}>
                    Next
                  </AppButton>
                ) : (
                  <AppButton size="lg" className="min-w-[190px]" onClick={handleContinue}>
                    Continue
                  </AppButton>
                )}
              </div>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </article>
      </section>

      {!isPortfolioOnlyPage && warningPopup ? (
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
