"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/shared/ui/AppButton";
import { AppDropdown, DropdownOption } from "@/components/shared/ui/AppDropdown";
import { runCandidateCode, saveCandidateDraft, submitCandidateTest } from "@/components/admin/lib/backendApi";
import { usePublicBranding } from "@/components/admin/lib/runtimeSettings";
import {
  clearCandidateSession,
  readCandidateSession,
  saveCandidateResultSummary,
} from "@/components/candidate/lib/candidateSessionStorage";
import { CandidateCountdown } from "@/components/candidate/components/CandidateCountdown";
import { useCandidateSecurityGuard } from "@/components/candidate/security/useCandidateSecurityGuard";
import { calculateMcqScore, calculateMcqTotal } from "@/components/candidate/security/scoring";
import { clearRuntimeState } from "@/components/candidate/security/runtimeStore";

type CodingTask = {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  examples: Array<{ input: string; output: string }>;
};

type CodeRunResult = {
  status: string;
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  time: string;
  memory: string;
};

const languageOptions: DropdownOption[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

const fallbackCodingTasks: CodingTask[] = [
  {
    id: "task-1",
    title: "Two Sum",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    starterCode: "function solution(input) {\n  // Write your code here\n}",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
  },
  {
    id: "task-2",
    title: "Reverse String",
    description:
      "Write a function that reverses a string without using built-in reverse methods. Return the reversed string as output.",
    starterCode: "function solution(input) {\n  // input: string\n  // output: reversed string\n}",
    examples: [
      { input: 's = "techforge"', output: '"egrofhcet"' },
      { input: 's = "secure"', output: '"eruces"' },
    ],
  },
  {
    id: "task-3",
    title: "Valid Parentheses",
    description:
      "Given a string containing just the characters ()[]{} determine if the input string is valid. Every opening bracket must be closed in the correct order.",
    starterCode: "function solution(input) {\n  // input: brackets string\n  // output: true or false\n}",
    examples: [
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
  },
];

function BrandMark() {
  return (
    <svg viewBox="0 0 50 34" className="h-[34px] w-[50px]" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="30" height="30" rx="7" stroke="#ffffff" strokeWidth="3" />
      <path d="M10 16L16 22L27 11" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 23C33 21.5 35 19 36 15" stroke="#15A8FF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px] text-[#d97706]">
      <path d="M12 4L20 18H4L12 4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 9.2V13.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="16.3" r="1" fill="currentColor" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
      <path d="M8 6.5V17.5L17 12L8 6.5Z" />
    </svg>
  );
}

export function CandidateCodingTaskScreen() {
  const router = useRouter();
  const branding = usePublicBranding();
  const session = useMemo(() => readCandidateSession(), []);
  const [taskIndex, setTaskIndex] = useState(0);
  const [language, setLanguage] = useState(languageOptions[0]?.value || "javascript");
  const [error, setError] = useState("");
  const [runError, setRunError] = useState("");
  const [runResult, setRunResult] = useState<CodeRunResult | null>(null);
  const [runInput, setRunInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const codingTasks = useMemo<CodingTask[]>(
    () =>
      session?.test?.codingTasks?.length
        ? session.test.codingTasks.map((task) => ({
            id: `task-${task.index + 1}`,
            title: task.title,
            description: task.description,
            starterCode: "function solution(input) {\n  // Write your code here\n}",
            examples: [
              { input: task.sampleInput || "input = ...", output: task.sampleOutput || "..." },
              { input: task.sampleInput || "input = ...", output: task.sampleOutput || "..." },
            ],
          }))
        : fallbackCodingTasks,
    [session]
  );
  const [codeByTask, setCodeByTask] = useState<Record<string, string>>(() =>
    Object.fromEntries(fallbackCodingTasks.map((task) => [task.id, task.starterCode])),
  );

  const activeTask = codingTasks[taskIndex];
  const codeValue = codeByTask[activeTask.id] ?? activeTask.starterCode;
  const codeLines = codeValue.split("\n");
  const { deadlineAt, warningCount, warningPopup, dismissWarningPopup } = useCandidateSecurityGuard({
    submissionId: session?.submissionId || "",
    candidateSessionToken: session?.candidateSessionToken || "",
    durationMinutes: session?.test?.durationMinutes || 90,
    security: session?.test?.security || {},
    onAutoSubmit: async (reason) => {
      if (!session?.submissionId || !session.candidateSessionToken) return;
      const mcqAnswers = session.mcqAnswers || [];
      const codingAnswers = codingTasks.map((task, index) => ({
        taskIndex: index,
        code: codeByTask[task.id] || task.starterCode,
        language,
      }));
      const response = await submitCandidateTest({
        submissionId: session.submissionId,
        candidateSessionToken: session.candidateSessionToken,
        mcqAnswers,
        codingAnswers,
        auto: true,
        endedReason: reason,
      });
      const mcqTotal = calculateMcqTotal(session.test.mcqQuestions || []);
      const mcqScore = calculateMcqScore(session.test.mcqQuestions || [], mcqAnswers);
      saveCandidateResultSummary({
        mcqScore: Math.min(mcqScore, response.submission.totalScore || mcqScore),
        mcqTotal,
        submittedAt: new Date().toISOString(),
      });
      clearRuntimeState(session.submissionId);
      clearCandidateSession();
      router.push("/candidate/submitted");
    },
  });

  useEffect(() => {
    setRunResult(null);
    setRunError("");
  }, [taskIndex, language]);

  function handleCodeChange(value: string) {
    setCodeByTask((prev) => ({ ...prev, [activeTask.id]: value }));
  }

  async function handleSubmitTask() {
    setError("");
    if (!session?.submissionId || !session.candidateSessionToken) {
      setError("Submission not found. Please login again.");
      return;
    }
    if (taskIndex < codingTasks.length - 1) {
      setTaskIndex((prev) => prev + 1);
      return;
    }
    try {
      const mcqAnswers = session.mcqAnswers || [];
      const codingAnswers = codingTasks.map((task, index) => ({
        taskIndex: index,
        code: codeByTask[task.id] || task.starterCode,
        language,
      }));
      const response = await submitCandidateTest({
        submissionId: session.submissionId,
        candidateSessionToken: session.candidateSessionToken,
        mcqAnswers,
        codingAnswers,
      });
      const mcqTotal = (session.test.mcqQuestions || []).reduce((sum, question) => sum + (question.marks || 1), 0);
      const mcqScore = calculateMcqScore(session.test.mcqQuestions || [], mcqAnswers);
      saveCandidateResultSummary({
        mcqScore: Math.min(mcqScore, response.submission.totalScore || mcqScore),
        mcqTotal,
        submittedAt: new Date().toISOString(),
      });
      clearRuntimeState(session.submissionId);
      clearCandidateSession();
      router.push("/candidate/submitted");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to submit test";
      setError(message);
    }
  }

  async function handleRunCode() {
    setError("");
    setRunError("");
    if (!session?.submissionId || !session.candidateSessionToken) {
      setError("Submission not found. Please login again.");
      return;
    }
    try {
      setIsRunning(true);
      const activeCode = codeByTask[activeTask.id] || activeTask.starterCode;
      const response = await runCandidateCode({
        submissionId: session.submissionId,
        candidateSessionToken: session.candidateSessionToken,
        language,
        sourceCode: activeCode,
        stdin: runInput,
      });
      setRunResult(response.result);

      await saveCandidateDraft({
        submissionId: session.submissionId,
        candidateSessionToken: session.candidateSessionToken,
        codingAnswers: codingTasks.map((task, index) => ({
          taskIndex: index,
          code: codeByTask[task.id] || task.starterCode,
          language,
        })),
      });
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : "Failed to run code";
      setRunError(message);
    } finally {
      setIsRunning(false);
    }
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1e1e1e] px-4">
        <div className="rounded-xl border border-[#3f3f46] bg-[#252526] p-6 text-center">
          <p className="text-base text-slate-200">Session not found. Please login again.</p>
          <AppButton className="mt-4" onClick={() => router.push("/candidate")}>Go To Candidate Login</AppButton>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#1e1e1e]">
      <header className="flex h-[76px] w-full items-center">
        <div className="flex h-full w-full max-w-[281px] items-center justify-center bg-[#1f3a8a] px-3">
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

        <div className="flex h-full w-full items-center gap-8 border-b border-[#3f3f46] bg-[#252526] px-8">
          <div className="flex-1 text-[18px] font-medium text-white">
            {`Task ${taskIndex + 1} of ${codingTasks.length}: ${activeTask.title}`}
          </div>

          <div className="flex items-center gap-5">
            <AppDropdown
              value={language}
              onChange={setLanguage}
              options={languageOptions}
              className="h-[60px] w-[179px]"
              triggerClassName="h-full rounded-[8px] border border-[#4c4c4c] bg-[#3c3c3c] px-4 text-[18px] font-medium text-white"
              menuClassName="rounded-[8px] border border-[#4c4c4c] bg-[#2f2f31] shadow-xl"
              optionClassName="px-4 py-2.5 text-sm text-slate-200 hover:bg-[#3a3a3d]"
              selectedOptionClassName="bg-[#1f3a8a] text-white"
              chevronClassName="text-slate-200"
            />
            <div className="flex h-[60px] w-[82px] items-center rounded-[8px] border border-[#4c4c4c] bg-[#3c3c3c] px-4 text-[18px] font-medium text-white">
              <CandidateCountdown deadlineAt={deadlineAt} />
            </div>
            <div className="flex h-[60px] items-center gap-[5px] whitespace-nowrap rounded-[8px] bg-[#4c3010] px-4">
              <WarningIcon />
              <p className="whitespace-nowrap text-[15px] font-semibold text-[#d97706]">{`${warningCount} Warning${warningCount === 1 ? "" : "s"}`}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="flex flex-1">
        <div className="flex flex-1 flex-col bg-[#1e1e1e] px-8 py-6">
          <div className="overflow-hidden rounded-[10px] border border-[#34343a] bg-[#1f1f23] shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
            <div className="flex h-11 items-center border-b border-[#34343a] bg-[#25252b] px-3">
              <div className="mr-3 flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#ff5f56]" />
                <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="size-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <div className="rounded-t-md border border-b-0 border-[#34343a] bg-[#1f1f23] px-3 py-1.5 text-xs text-slate-200">
                {`${activeTask.title}.txt`}
              </div>
            </div>

            <div className="flex min-h-[420px] gap-4 p-4">
              <div className="min-w-[40px] pt-[2px] text-right font-mono text-sm leading-7 text-[#6b7280]">
                {codeLines.map((_, index) => (
                  <p key={index}>{index + 1}</p>
                ))}
              </div>
              <div className="w-px self-stretch bg-[#34343a]" />
              <textarea
                value={codeValue}
                onChange={(event) => handleCodeChange(event.target.value)}
                spellCheck={false}
                className="h-[420px] w-full resize-none bg-transparent font-mono text-[15px] leading-7 text-[#f8fafc] outline-none placeholder:text-[#9ca3af]"
              />
            </div>
          </div>

          <div className="mt-4 border-t border-[#3f3f46] pt-6">
            <div className="mb-4">
              <p className="mb-1 text-sm font-medium text-slate-300">Input (optional)</p>
              <textarea
                value={runInput}
                onChange={(event) => setRunInput(event.target.value)}
                placeholder="Enter stdin input for your program"
                className="h-[90px] w-full resize-none rounded-[8px] border border-[#4c4c4c] bg-[#2f2f31] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-[#1f3a8a]"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <AppButton
                type="button"
                variant="secondary"
                size="lg"
                className="h-[52px] w-[190px] rounded-[8px] bg-[#eef2ff] text-[#1f3a8a] hover:bg-[#dbe4ff]"
                leftIcon={<PlayIcon />}
                onClick={handleRunCode}
                disabled={isRunning}
              >
                {isRunning ? "Running..." : "Run Code"}
              </AppButton>
              <AppButton
                type="button"
                variant="primary"
                size="lg"
                className="h-[52px] w-[190px] rounded-[8px] bg-[#1f3a8a] text-white hover:bg-[#162f74]"
                onClick={handleSubmitTask}
              >
                {taskIndex < codingTasks.length - 1 ? "Submit & Next" : "Submit"}
              </AppButton>
            </div>
            {runResult ? (
              <div className="mt-4 rounded-[8px] border border-[#3f3f46] bg-[#1f1f23] p-4">
                <p className="text-sm font-semibold text-slate-100">
                  Status: <span className="text-[#93c5fd]">{runResult.status}</span>
                </p>
                {(runResult.time || runResult.memory) && (
                  <p className="mt-1 text-xs text-slate-400">
                    {runResult.time ? `Time: ${runResult.time}s` : ""}
                    {runResult.time && runResult.memory ? " | " : ""}
                    {runResult.memory ? `Memory: ${runResult.memory} KB` : ""}
                  </p>
                )}
                <div className="mt-3 space-y-2 text-sm">
                  {runResult.stdout ? (
                    <div>
                      <p className="font-medium text-[#22c55e]">Output</p>
                      <pre className="mt-1 whitespace-pre-wrap rounded border border-[#2e2e33] bg-[#111215] p-2 text-slate-100">
                        {runResult.stdout}
                      </pre>
                    </div>
                  ) : null}
                  {runResult.stderr ? (
                    <div>
                      <p className="font-medium text-red-400">Runtime Error</p>
                      <pre className="mt-1 whitespace-pre-wrap rounded border border-[#3e1f1f] bg-[#1b1111] p-2 text-red-300">
                        {runResult.stderr}
                      </pre>
                    </div>
                  ) : null}
                  {runResult.compileOutput ? (
                    <div>
                      <p className="font-medium text-amber-400">Compile Output</p>
                      <pre className="mt-1 whitespace-pre-wrap rounded border border-[#3a2f16] bg-[#1b1710] p-2 text-amber-300">
                        {runResult.compileOutput}
                      </pre>
                    </div>
                  ) : null}
                  {runResult.message ? (
                    <p className="text-slate-300">{runResult.message}</p>
                  ) : null}
                </div>
              </div>
            ) : null}
            {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
            {runError ? <p className="mt-3 text-sm text-red-500">{runError}</p> : null}
          </div>
        </div>

        <aside className="flex w-full max-w-[400px] flex-col bg-[#252526] px-6 py-6">
          <div className="flex-1">
            <h2 className="text-[34px] font-semibold leading-[24px] tracking-[-0.33px] text-white [zoom:0.64]">{activeTask.title}</h2>
            <p className="mt-3 text-[16px] leading-[22px] text-[#d1d5db]">{activeTask.description}</p>

            <h3 className="mt-8 text-[18px] font-semibold text-white">Examples</h3>
            <div className="mt-4 space-y-3">
              {activeTask.examples.map((example, index) => (
                <div key={index} className="rounded-[8px] border border-[#7c8694] bg-[#1e1e1e] px-4 py-5">
                  <p className="text-[16px] text-[#d1d5db]">
                    <span className="mr-1">Input:</span>
                    <span className="font-medium text-white">{example.input}</span>
                  </p>
                  <p className="mt-2 text-[16px] text-[#d1d5db]">
                    <span className="mr-1">Output:</span>
                    <span className="font-semibold text-[#16a34a]">{example.output}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-[#3f3f46] pt-6">
            <div className="flex items-center gap-3">
              {codingTasks.map((task, index) => {
                const isActive = taskIndex === index;
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setTaskIndex(index)}
                    className={`h-[52px] flex-1 rounded-[8px] text-[26px] font-medium tracking-[-0.27px] [zoom:0.64] ${
                      isActive
                        ? "bg-[#162861] text-white"
                        : "bg-[#e0e7ff] text-[#1f3a8a] hover:bg-[#cdd8ff]"
                    }`}
                  >
                    {`Task ${index + 1}`}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </section>

      <footer className="mt-auto border-t border-[#3f3f46] bg-[#252526] py-3">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-2 px-4 text-base text-[#f1f5f9] sm:flex-row sm:px-8">
          <p>&copy; 2026 {branding.companyName || "Hire Secure"} All right reserved</p>
          <p>powered by TechForge Innovations</p>
        </div>
      </footer>

      {warningPopup ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/65 px-4">
          <div className="w-full max-w-[460px] rounded-[12px] border border-[#f5c172] bg-[#111827] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[#4c3010] p-2 text-[#f59e0b]">
                <WarningIcon />
              </div>
              <div className="flex-1">
                <h3 className="text-[22px] font-semibold text-white [zoom:0.7]">{warningPopup.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{warningPopup.message}</p>
                <p className="mt-3 text-sm font-semibold text-[#f59e0b]">
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
