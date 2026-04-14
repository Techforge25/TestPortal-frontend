"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCandidateEvaluationStatus } from "@/components/admin/lib/backendApi";
import { usePublicBranding } from "@/components/admin/lib/runtimeSettings";
import { getSupportedSections, isCodingEnabled, isMcqEnabled } from "@/components/candidate/lib/assessmentFlow";
import { calculateMcqScore, calculateMcqTotal } from "@/components/candidate/security/scoring";
import { AppButton } from "@/components/shared/ui/AppButton";
import { useRealtimeSubscription } from "@/components/shared/realtime/useRealtimeSubscription";
import {
  clearCandidateSession,
  readCandidateSession,
  clearCandidateResultSummary,
  readCandidateResultSummary,
} from "@/components/candidate/lib/candidateSessionStorage";

function CheckBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6 text-white">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 12L11 14.5L15.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4 text-[#64748b]">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8.4V12L14.6 13.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4 text-[#f59e0b]">
      <path d="M8.2 8.8L5.2 12L8.2 15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.8 8.8L18.8 12L15.8 15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4 text-[#4f46e5]">
      <rect x="7" y="6" width="10" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9.5 6V4.8C9.5 4.3 9.9 4 10.4 4H13.6C14.1 4 14.5 4.3 14.5 4.8V6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4 text-[#0f766e]">
      <path d="M12 3.5L13.9 8.1L18.5 10L13.9 11.9L12 16.5L10.1 11.9L5.5 10L10.1 8.1L12 3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

const sectionLabels: Record<string, string> = {
  short_answer: "Short Answer",
  long_answer: "Long Answer",
  scenario: "Scenario",
  ui_preview: "UI Preview Task",
  portfolio_link: "Portfolio / Link",
  bug_report: "Bug Report",
  test_case: "Test Case",
};

export function CandidateSubmissionSuccessScreen() {
  const router = useRouter();
  const branding = usePublicBranding();
  const summary = useMemo(() => readCandidateResultSummary(), []);
  const session = useMemo(() => readCandidateSession(), []);
  const safeSummary = useMemo(() => {
    if (!session) return summary;
    if (!summary) return null;
    if (!summary.submissionId) return null;
    if (summary.submissionId !== session.submissionId) return null;
    return summary;
  }, [session, summary]);

  const fallbackMcqTotal = useMemo(
    () => calculateMcqTotal(session?.test?.mcqQuestions || []),
    [session]
  );
  const fallbackMcqScore = useMemo(
    () => calculateMcqScore(session?.test?.mcqQuestions || [], session?.mcqAnswers || []),
    [session]
  );

  const [mcqSummary, setMcqSummary] = useState<{ score: number; total: number }>({
    score: safeSummary?.mcqScore ?? fallbackMcqScore,
    total: safeSummary?.mcqTotal ?? fallbackMcqTotal,
  });
  const mcqScore = mcqSummary.score;
  const mcqTotal = mcqSummary.total;
  const codingEnabled = isCodingEnabled(session);
  const mcqEnabled = isMcqEnabled(session);
  const nonCodingSections = getSupportedSections(session).filter((section) => section !== "mcq" && section !== "coding");
  const hasNonCodingSections = nonCodingSections.length > 0;
  const reviewLabel = hasNonCodingSections ? "Section Review" : "Assessment";
  const sectionsLabel = nonCodingSections.map((key) => sectionLabels[key] || key).join(", ");
  const submittedLabel = safeSummary?.submittedAt
    ? new Date(safeSummary.submittedAt).toLocaleString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Wednesday, March 4, 2026 at 11:27 PM";
  const [codingEval, setCodingEval] = useState<{
    status: "not_required" | "queued" | "running" | "completed" | "failed";
    totalMarks: number;
    maxMarks: number;
  } | null>(
    safeSummary?.codingEvaluation
      ? {
          status: safeSummary.codingEvaluation.status,
          totalMarks: Number(safeSummary.codingEvaluation.totalMarks || 0),
          maxMarks: Number(safeSummary.codingEvaluation.maxMarks || 0),
        }
      : null
  );
  const [evalFetchError, setEvalFetchError] = useState(false);
  const [statusWatchStartedAt] = useState(() => Date.now());

  useEffect(() => {
    setMcqSummary({
      score: safeSummary?.mcqScore ?? fallbackMcqScore,
      total: safeSummary?.mcqTotal ?? fallbackMcqTotal,
    });
  }, [safeSummary?.mcqScore, safeSummary?.mcqTotal, fallbackMcqScore, fallbackMcqTotal]);

  useEffect(() => {
    if (!session?.submissionId || !session?.candidateSessionToken) return;
    const submissionId = session.submissionId;
    const candidateSessionToken = session.candidateSessionToken;
    async function refreshEvaluationStatus() {
      try {
        const result = await getCandidateEvaluationStatus({
          submissionId,
          candidateSessionToken,
        });
        setEvalFetchError(false);
        const next = result?.evaluation;
        const backendMcqScore = Number(next?.mcqScore);
        const backendMcqTotal = Number(next?.mcqTotal);
        if (
          Number.isFinite(backendMcqScore) &&
          backendMcqScore >= 0 &&
          Number.isFinite(backendMcqTotal) &&
          backendMcqTotal >= 0
        ) {
          setMcqSummary({
            score: backendMcqScore,
            total: backendMcqTotal,
          });
        }
        setCodingEval({
          status: next?.status || "queued",
          totalMarks: Number(next?.totalMarks || 0),
          maxMarks: Number(next?.maxMarks || 0),
        });
      } catch {
        setEvalFetchError(true);
      }
    }
    void refreshEvaluationStatus();
  }, [session?.submissionId, session?.candidateSessionToken]);

  useRealtimeSubscription({
    token: session?.candidateSessionToken || null,
    events: [
      "candidate:evaluation.updated",
      `candidate:evaluation.updated:${session?.submissionId || ""}`,
      "candidate:data.changed",
    ],
    onEvent: async () => {
      if (!session?.submissionId || !session?.candidateSessionToken) return;
      const submissionId = session.submissionId;
      const candidateSessionToken = session.candidateSessionToken;
      try {
        const result = await getCandidateEvaluationStatus({
          submissionId,
          candidateSessionToken,
        });
        setEvalFetchError(false);
        const next = result?.evaluation;
        const backendMcqScore = Number(next?.mcqScore);
        const backendMcqTotal = Number(next?.mcqTotal);
        if (
          Number.isFinite(backendMcqScore) &&
          backendMcqScore >= 0 &&
          Number.isFinite(backendMcqTotal) &&
          backendMcqTotal >= 0
        ) {
          setMcqSummary({
            score: backendMcqScore,
            total: backendMcqTotal,
          });
        }
        setCodingEval({
          status: next?.status || "queued",
          totalMarks: Number(next?.totalMarks || 0),
          maxMarks: Number(next?.maxMarks || 0),
        });
      } catch {
        setEvalFetchError(true);
      }
    },
    enabled: Boolean(session?.submissionId && session?.candidateSessionToken),
  });

  const codingStatusText =
    codingEval?.status === "completed"
      ? `${codingEval.totalMarks}/${codingEval.maxMarks || 0} (Auto Evaluated)`
      : codingEval?.status === "running"
        ? "Evaluating..."
        : codingEval?.status === "queued"
          ? "Queued for evaluation..."
          : codingEval?.status === "failed"
            ? "Evaluation failed"
            : codingEnabled
              ? "Checking automation status..."
              : "Under Review";
  const isDelayedEvaluation =
    Boolean(codingEnabled) &&
    (codingEval?.status === "queued" || codingEval?.status === "running" || !codingEval) &&
    Date.now() - statusWatchStartedAt > 20000;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#e7f0ea] via-[#d0dce8] to-[#adbfdf] px-4 py-10">
      <div className="pointer-events-none absolute -left-24 top-8 size-72 rounded-full bg-[#1f3a8a]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-8 size-72 rounded-full bg-[#0ea5e9]/20 blur-3xl" />

      <section className="relative w-full max-w-[780px] text-center">
        <div className="mx-auto flex size-[72px] items-center justify-center rounded-full bg-[#1f3a8a] shadow-[0_16px_36px_rgba(31,58,138,0.35)]">
          <CheckBadgeIcon />
        </div>

        <h1 className="mt-6 text-[38px] font-semibold tracking-[-0.02em] text-[#0f172a]">Test Submitted Successfully!</h1>
        <p className="mt-2 text-[15px] text-[#334155]">Thank you for completing your assessment. Your submission is now in review.</p>

        <article className="mx-auto mt-8 w-full max-w-[620px] rounded-2xl border border-white/70 bg-white/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            {mcqEnabled ? (
              <div className="rounded-xl border border-[#dbe7ff] bg-gradient-to-br from-[#eef2ff] to-[#e3ebff] p-4 text-left">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#4f46e5]">
                  <ClipboardIcon />
                  MCQ Score
                </p>
                <p className="mt-2 text-[24px] font-semibold leading-none text-[#0f172a]">{`${mcqScore}/${mcqTotal}`}</p>
              </div>
            ) : null}

            {codingEnabled ? (
              <div className="rounded-xl border border-[#ffe5cc] bg-gradient-to-br from-[#fff7ed] to-[#ffedd8] p-4 text-left">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#d97706]">
                  <CodeIcon />
                  Coding
                </p>
                <p className="mt-2 text-[16px] font-semibold text-[#0f172a]">{codingStatusText}</p>
                <p className="mt-1 text-xs text-[#7c2d12]">
                  {evalFetchError
                    ? "Could not reach evaluation service. Retry in progress..."
                    : codingEval?.status === "completed"
                      ? "Evaluation finished successfully."
                      : codingEval?.status === "failed"
                        ? "Evaluation failed. Admin can re-check from review panel."
                        : isDelayedEvaluation
                          ? "Evaluation queue is taking longer than expected. Please wait a moment."
                          : "Auto-check is running in background."}
                </p>
              </div>
            ) : null}

            {hasNonCodingSections ? (
              <div className="rounded-xl border border-[#bfedf0] bg-gradient-to-br from-[#ecfeff] to-[#dff8fa] p-4 text-left sm:col-span-2">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#0f766e]">
                  <SparkleIcon />
                  Sections Submitted
                </p>
                <p className="mt-2 text-[16px] font-semibold text-[#0f172a]">
                  {`${nonCodingSections.length} section${nonCodingSections.length > 1 ? "s" : ""} under review`}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-[#0f766e]">{sectionsLabel}</p>
              </div>
            ) : null}

            {!mcqEnabled && !codingEnabled && !hasNonCodingSections ? (
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 text-left sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[#475569]">{reviewLabel}</p>
                <p className="mt-2 text-[16px] font-semibold text-[#0f172a]">Under Review</p>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-[#e2e8f0] pt-4 text-sm text-[#64748b]">
            <ClockIcon />
            <span className="font-medium">Submitted:</span>
            <span>{submittedLabel}</span>
          </div>
        </article>

        <article className="mx-auto mt-4 w-full max-w-[620px] rounded-xl border border-white/70 bg-white/90 p-4 text-sm text-[#475569] shadow-[0_12px_28px_rgba(15,23,42,0.12)]">
          <p>
            You will receive the final update via <span className="font-semibold text-[#0f172a]">a phone call within 2-3 business days</span>.
          </p>
          <p className="mt-1">Please keep your phone available for the final decision call.</p>
        </article>

        <div className="mt-6">
          <AppButton
            onClick={() => {
              clearCandidateResultSummary();
              clearCandidateSession();
              router.push("/");
            }}
            className="h-12 rounded-[10px] px-10 text-base"
          >
            Back To Login
          </AppButton>
        </div>

        <p className="mt-6 text-sm font-semibold tracking-[0.01em] text-[#1e293b] drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">
          {`Powered by ${branding.companyName || "TechForge Innovation"}`}
        </p>
      </section>
    </main>
  );
}
