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
import { getRouteAfterMcq, isMcqEnabled } from "@/components/candidate/lib/assessmentFlow";

type LocalMcqQuestion = {
  id: string;
  text: string;
  options: string[];
};

const fallbackQuestions: LocalMcqQuestion[] = [
  {
    id: "q1",
    text: "What is the output of console.log(typeof null)?",
    options: ["null", "undefined", "object", "string"],
  },
  {
    id: "q2",
    text: "Which method is used to add elements to the end of an array?",
    options: ["push()", "pop()", "shift()", "unshift()"],
  },
  {
    id: "q3",
    text: "Which keyword is used to declare a constant in JavaScript?",
    options: ["let", "const", "var", "static"],
  },
  {
    id: "q4",
    text: "Which hook is used for side effects in React?",
    options: ["useMemo", "useEffect", "useRef", "useCallback"],
  },
  {
    id: "q5",
    text: "Which symbol is used for strict equality in JavaScript?",
    options: ["=", "==", "===", "!=="],
  },
  {
    id: "q6",
    text: "Which HTML tag is used to include JavaScript?",
    options: ["<js>", "<script>", "<javascript>", "<code>"],
  },
  {
    id: "q7",
    text: "Which array method creates a new array with transformed values?",
    options: ["forEach", "map", "filter", "reduce"],
  },
  {
    id: "q8",
    text: "What does CSS stand for?",
    options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Syntax", "Colorful Style Sheets"],
  },
  {
    id: "q9",
    text: "Which React feature helps optimize expensive calculations?",
    options: ["useEffect", "useState", "useMemo", "useLayoutEffect"],
  },
  {
    id: "q10",
    text: "Which HTTP method is typically used to update a resource?",
    options: ["GET", "POST", "PUT", "HEAD"],
  },
];

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px] text-[#d97706]">
      <path d="M12 4L20 18H4L12 4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 9.2V13.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="16.3" r="1" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5">
      <path d="M6.5 12.5L10.1 16L17.5 8.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5">
      <path d="M14.8 6.8L9.6 12L14.8 17.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BrandMark() {
  return (
    <svg viewBox="0 0 50 34" className="h-[34px] w-[50px]" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="30" height="30" rx="7" stroke="#ffffff" strokeWidth="3" />
      <path d="M10 16L16 22L27 11" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 23C33 21.5 35 19 36 15" stroke="#15A8FF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type OptionItemProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

function OptionItem({ label, selected, onClick }: OptionItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-[14px] rounded-[8px] border p-4 text-left transition-colors ${
        selected ? "border-[#1f3a8a] bg-[#eff3ff]" : "border-[#e2e8f0] bg-white hover:bg-[#f8faff]"
      }`}
    >
      <span
        className={`flex size-[22px] items-center justify-center rounded-full border ${
          selected ? "border-[#1f3a8a]" : "border-[#9ca3af]"
        }`}
      >
        {selected ? <span className="size-3 rounded-full bg-[#1f3a8a]" /> : null}
      </span>
      <span className="text-[28px] font-medium leading-[20px] text-[#0f172a] [zoom:0.64]">{label}</span>
    </button>
  );
}

export function CandidateMcqTestScreen() {
  const router = useRouter();
  const branding = usePublicBranding();
  const session = useMemo(() => readCandidateSession(), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState("");
  const mcqEnabled = isMcqEnabled(session);

  const questions = useMemo<LocalMcqQuestion[]>(
    () =>
      session?.test?.mcqQuestions?.length
        ? session.test.mcqQuestions.map((question) => ({
            id: `q${question.index + 1}`,
            text: question.question,
            options: question.options,
          }))
        : fallbackQuestions,
    [session]
  );

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
  const { deadlineAt, warningCount, warningPopup, dismissWarningPopup } = useCandidateSecurityGuard({
    submissionId: session?.submissionId || "",
    candidateSessionToken: session?.candidateSessionToken || "",
    durationMinutes: session?.test?.durationMinutes || 90,
    security: session?.test?.security || {},
    onAutoSubmit: async (reason) => {
      if (!session?.submissionId || !session.candidateSessionToken) return;
      const mcqAnswers = Object.entries(selectedAnswers).map(([questionIndex, selectedOptionIndex]) => ({
        questionIndex: Number(questionIndex),
        selectedOptionIndex,
      }));
      await submitCandidateTest({
        submissionId: session.submissionId,
        candidateSessionToken: session.candidateSessionToken,
        mcqAnswers,
        codingAnswers: [],
        sectionAnswers: session.sectionAnswers || [],
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

  function selectAnswer(answerIndex: number) {
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: answerIndex }));
  }

  function goNext() {
    setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
  }

  function goPrevious() {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }

  async function submitSection() {
    setError("");
    const mcqAnswers = Object.entries(selectedAnswers).map(([questionIndex, selectedOptionIndex]) => ({
      questionIndex: Number(questionIndex),
      selectedOptionIndex,
    }));
    if (session?.submissionId) {
      try {
        await saveCandidateDraft({
          submissionId: session.submissionId,
          candidateSessionToken: session.candidateSessionToken,
          mcqAnswers,
        });
        saveCandidateSession({
          ...session,
          mcqAnswers,
        });
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : "Failed to save MCQ answers";
        setError(message);
        return;
      }
    }
    router.push(getRouteAfterMcq(session));
  }

  useEffect(() => {
    if (!session) return;
    if (mcqEnabled) return;
    const next = getRouteAfterMcq(session);
    router.push(next);
  }, [mcqEnabled, router, session]);

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

  return (
    <main className="flex min-h-screen flex-col bg-[#f8fafc]">
      <header className="flex w-full items-center">
        <div className="flex h-[76px] w-full max-w-[281px] items-center justify-center bg-[#1f3a8a] px-3">
          <div className="flex items-center gap-2">
            {branding.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logoDataUrl} alt="Company logo" className="h-[34px] w-[50px] rounded object-contain" />
            ) : (
              <BrandMark />
            )}
            <div className="leading-none text-white">
              <p className="text-[24px] font-bold tracking-tight">{branding.companyName || "Hire Secure"}</p>
              <p className="mt-1 text-[12px]">Secure Talent. Smart Decisions.</p>
            </div>
          </div>
        </div>

        <div className="flex h-[76px] w-full items-center gap-6 border-b border-[#e3e7ee] bg-[#f2f5ff] px-8 shadow-[0_4px_28px_rgba(143,154,167,0.16)]">
          <div className="w-full rounded-[10px] border border-[#dbe4ff] bg-white/70 px-4 py-2">
            <div className="mb-2 flex items-center justify-between text-[15px] font-semibold tracking-[-0.2px] text-[#334155]">
              <p>{`Question ${currentIndex + 1} of ${totalQuestions}`}</p>
              <p>{`${answeredCount} Answered`}</p>
            </div>
            <div className="h-[16px] w-full rounded-full border border-[#cbd5e1] bg-[#e8edf6] p-[2px]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1f3a8a] to-[#2748a4] shadow-[0_1px_6px_rgba(31,58,138,0.35)] transition-all"
                style={{ width: `${Math.max(progressPercent, 6)}%` }}
              />
            </div>
          </div>

            <div className="flex items-center gap-4">
              <div className="flex h-[52px] w-[94px] items-center justify-center rounded-[8px] border border-[#dbe4ff] bg-white px-4">
                <CandidateCountdown deadlineAt={deadlineAt} className="text-[17px] font-semibold text-[#0f172a]" />
              </div>
            <div className="flex h-[52px] items-center gap-[5px] rounded-[8px] bg-[#fff2e4] px-4 whitespace-nowrap">
              <WarningIcon />
              <p className="whitespace-nowrap text-[15px] font-semibold text-[#d97706]">{`${warningCount} Warning${warningCount === 1 ? "" : "s"}`}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-[1320px] flex-1 gap-[42px] px-6 pb-16 pt-12">
        <div className="flex-1">
          <div className="rounded-[12px] border border-[#e2e8f0] bg-white px-6 py-8">
            <div className="mb-6 inline-flex items-center justify-center rounded-[8px] border border-[#162861] bg-[#f9faff] px-5 py-[10px]">
              <p className="text-[28px] font-semibold leading-[20px] text-[#162861] [zoom:0.64]">{`Q ${currentIndex + 1}`}</p>
            </div>
            <p className="mb-6 px-2 text-[28px] font-medium leading-[20px] text-[#0f172a] [zoom:0.64]">{currentQuestion.text}</p>
            <div className="space-y-[14px]">
              {currentQuestion.options.map((option, optionIndex) => (
                <OptionItem
                  key={option}
                  label={option}
                  selected={selectedAnswers[currentIndex] === optionIndex}
                  onClick={() => selectAnswer(optionIndex)}
                />
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            {currentIndex > 0 ? (
              <AppButton type="button" variant="outline" size="lg" className="h-[52px] rounded-[10px] px-4" leftIcon={<ArrowLeftIcon />} onClick={goPrevious}>
                Previous
              </AppButton>
            ) : (
              <div />
            )}

            {currentIndex < totalQuestions - 1 ? (
              <AppButton type="button" variant="primary" size="lg" className="h-[52px] min-w-[156px] rounded-[10px]" rightIcon={<CheckIcon />} onClick={goNext}>
                Next
              </AppButton>
            ) : (
              <AppButton
                type="button"
                variant="primary"
                size="lg"
                className="h-[52px] min-w-[156px] rounded-[10px]"
                rightIcon={<CheckIcon />}
                onClick={submitSection}
              >
                Submit
              </AppButton>
            )}
          </div>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>

        <aside className="w-full max-w-[326px] rounded-[8px] border border-[#e2e8f0] bg-white px-4 py-6">
          <h2 className="text-[34px] font-semibold leading-[24px] tracking-[-0.33px] text-[#0f172a] [zoom:0.64]">Add MCQ Questions</h2>
          <div className="mt-6 grid grid-cols-5 gap-3">
            {questions.map((_, index) => {
              const isCurrent = index === currentIndex;
              const isAnswered = selectedAnswers[index] !== undefined;
              const className = isCurrent
                ? "bg-[#1f3a8a] text-white border border-[#1f3a8a]"
                : isAnswered
                  ? "bg-[#eff3ff] text-[#1f3a8a] border border-[#1f3a8a]"
                  : "bg-white text-[#475569] border border-[#e2e8f0] hover:bg-[#f8faff]";
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`h-[42px] rounded-[8px] text-[16px] font-medium leading-[20px] transition-colors ${className}`}
                >
                  {String(index + 1).padStart(2, "0")}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-1 text-[16px] font-medium leading-[24px] tracking-[-0.24px] text-[#475569]">
            <div className="flex items-center gap-[10px]">
              <span className="size-[18px] rounded-[2px] bg-[#1f3a8a]" />
              <p>Current</p>
            </div>
            <div className="flex items-center gap-[10px]">
              <span className="size-[18px] rounded-[2px] border border-[#1f3a8a] bg-[#eff3ff]" />
              <p>Answered</p>
            </div>
            <div className="flex items-center gap-[10px]">
              <span className="size-[18px] rounded-[2px] border border-[#475569] bg-white" />
              <p>Unanswered</p>
            </div>
          </div>
        </aside>
      </section>

      <footer className="mt-auto border-t border-[#e2e8f0] bg-white py-3">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-2 px-4 text-base text-[#666c77] sm:flex-row sm:px-8">
          <p>&copy; 2026 {branding.companyName || "Hire Secure"} All right reserved</p>
          <p>powered by TechForge Innovations</p>
        </div>
      </footer>

      {warningPopup ? (
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
