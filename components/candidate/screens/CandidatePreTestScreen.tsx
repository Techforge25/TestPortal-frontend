"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/shared/ui/AppButton";
import { usePublicBranding } from "@/components/admin/lib/runtimeSettings";
import { useCandidateRealtimeState } from "@/components/candidate/hooks/useCandidateRealtimeState";
import { getCandidateStartRoute, isCodingEnabled, isMcqEnabled } from "@/components/candidate/lib/assessmentFlow";
import { clearCandidateAuthDraft } from "@/components/candidate/lib/candidateAuthDraft";

function TimeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px] text-[#f59e0b]">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8.3V12L14.8 13.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px] text-[#2563eb]">
      <path d="M14 6H18V10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10 18H6V14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M18 6L13 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6 18L11 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px] text-[#ef4444]">
      <path d="M12 4L20 18H4L12 4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 9V13.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  );
}

function CopyOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px] text-[#7c3aed]">
      <rect x="9" y="9" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 15V7C5 5.9 5.9 5 7 5H15" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 5L19 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function DevToolsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px] text-[#64748b]">
      <path d="M8 7L4 12L8 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 7L20 12L16 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10 19L14 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-[24px] text-white">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 12L11 14.5L15.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-[24px] text-white">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.8V12L14.8 13.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg viewBox="0 -960 960 960" className="size-5 fill-current" aria-hidden="true">
      <path d="m226-559 78 33q14-28 29-54t33-52l-56-11-84 84Zm142 83 114 113q42-16 90-49t90-75q70-70 109.5-155.5T806-800q-72-5-158 34.5T492-656q-42 42-75 90t-49 90Zm155-121.5q0-33.5 23-56.5t57-23q34 0 57 23t23 56.5q0 33.5-23 56.5t-57 23q-34 0-57-23t-23-56.5ZM565-220l84-84-11-56q-26 18-52 32.5T532-299l33 79Zm313-653q19 121-23.5 235.5T708-419l20 99q4 20-2 39t-20 33L538-80l-84-197-171-171-197-84 167-168q14-14 33.5-20t39.5-2l99 20q104-104 218-147t235-24ZM157-321q35-35 85.5-35.5T328-322q35 35 34.5 85.5T327-151q-25 25-83.5 43T82-76q14-103 32-161.5t43-83.5Zm57 56q-10 10-20 36.5T180-175q27-4 53.5-13.5T270-208q12-12 13-29t-11-29q-12-12-29-11.5T214-265Z" />
    </svg>
  );
}

export function CandidatePreTestScreen() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const branding = usePublicBranding();
  const { session } = useCandidateRealtimeState();
  const test = session?.test;
  const mcqEnabled = isMcqEnabled(session);
  const codingEnabled = isCodingEnabled(session);
  const totalMcqs = mcqEnabled ? test?.mcqQuestions?.length || 0 : 0;
  const totalTasks = codingEnabled ? test?.codingTasks?.length || 0 : 0;
  const startRoute = getCandidateStartRoute(session);
  const duration = test?.durationMinutes || 0;
  const autoSaveInterval = test?.security?.autoSaveIntervalSeconds || 60;
  const warningLimit = test?.security?.warningLimit || 2;
  const riskRules = [
    { icon: <TimeIcon />, bg: "bg-[#fff9f3]", text: "Timer starts immediately and cannot be paused" },
    ...(test?.security?.forceFullscreen
      ? [{ icon: <FullscreenIcon />, bg: "bg-[#eff6ff]", text: "Fullscreen mode is required throughout the test" }]
      : []),
    ...(test?.security?.disableTabSwitch
      ? [
          {
            icon: <WarningIcon />,
            bg: "bg-[#fff2f2]",
            text: test?.security?.autoEndOnTabChange
              ? "Tab switching will automatically end your test"
              : `Tab switching will trigger warnings (limit: ${warningLimit})`,
          },
        ]
      : []),
    ...(test?.security?.disableCopyPaste
      ? [{ icon: <CopyOffIcon />, bg: "bg-[#f7f0ff]", text: "Copy/paste functionality is disabled" }]
      : []),
    ...(test?.security?.detectDevTools
      ? [{ icon: <DevToolsIcon />, bg: "bg-[#f0f6ff]", text: "Developer tools are monitored" }]
      : []),
  ];
  const generalRules = [
    `The test will begin immediately once you click "Start Test".`,
    "You cannot pause the test once started.",
    "Ensure you have a stable internet connection throughout.",
    "Do not refresh the page during the test.",
    "Answer all questions to the best of your ability.",
    "Partial marks may be awarded for coding tasks.",
    `Your progress is auto-saved every ${autoSaveInterval} seconds.`,
  ];

  useEffect(() => {
    if (!session?.submissionId) return;
    // Clear auth draft after session route is mounted to avoid auth-guard flicker on start click.
    clearCandidateAuthDraft();
  }, [session?.submissionId]);

  if (!session || !test) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-6 text-center">
          <p className="text-base text-[#475569]">Session not found. Please login with passcode again.</p>
          <AppButton className="mt-4" onClick={() => router.push("/candidate")}>Go To Candidate Login</AppButton>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <section className="mx-auto w-full max-w-[1084px] px-4 pb-8 pt-10 sm:px-6 lg:px-8">
        <article className="overflow-hidden rounded-[24px]">
          <header className="bg-[#1f3a8a] px-6 py-8 text-white">
            <h1 className="text-[22px] font-semibold tracking-[-0.33px]">React Frontend Assessment</h1>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="flex items-center gap-3 text-[30px] [zoom:0.58]">
                <ClockCircle />
                <p>{duration} minutes</p>
              </div>
              {mcqEnabled ? (
                <div className="flex items-center gap-3 text-[30px] [zoom:0.58]">
                  <CheckCircle />
                  <p>{totalMcqs} MCQ Questions</p>
                </div>
              ) : null}
              {codingEnabled ? (
                <div className="flex items-center gap-3 text-[30px] [zoom:0.58]">
                  <CheckCircle />
                  <p>{totalTasks} Coding Tasks</p>
                </div>
              ) : null}
            </div>
          </header>

          <div className="space-y-8 bg-white px-6 py-8">
            <section>
              <h2 className="text-[22px] font-semibold tracking-[-0.33px] text-[#0f172a]">{test.title}</h2>
              <div className="mt-6 space-y-[18px]">
                {riskRules.map((rule) => (
                  <div key={rule.text} className="flex items-center gap-[10px]">
                    <div className={`flex size-8 items-center justify-center rounded-[8px] ${rule.bg}`}>{rule.icon}</div>
                    <p className="text-[18px] font-medium text-[#475569]">{rule.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-[22px] font-semibold tracking-[-0.33px] text-[#0f172a]">{test.title}</h2>
              <div className="mt-6 space-y-[18px]">
                {generalRules.map((rule, index) => (
                  <div key={rule} className="flex items-center gap-[10px]">
                    <div className="flex size-8 items-center justify-center rounded-[8px] bg-[#eff3ff] text-[18px] font-medium text-[#1f3a8a]">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <p className="text-[18px] font-medium text-[#475569]">{rule}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-8">
              <label className="flex items-start gap-[10px]">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                  className="mt-[2px] size-[22px] rounded-[4px] border border-[#1f3a8a] accent-[#1f3a8a]"
                />
                <p className="text-[18px] tracking-[-0.27px] text-[#373737]">
                  I have read and agree to all the rules and conditions. I understand that any violation of these rules
                  may result in automatic submission of my test.
                </p>
              </label>

              <AppButton
                type="button"
                size="lg"
                variant="primary"
                disabled={!accepted || !startRoute}
                className="w-full rounded-[10px]"
                rightIcon={<RocketIcon />}
                onClick={() => {
                  if (!startRoute) return;
                  router.push(startRoute);
                }}
              >
                Start Test
              </AppButton>
              {!startRoute ? (
                <p className="text-sm text-red-600">
                  This test has no supported candidate sections yet. Please contact admin.
                </p>
              ) : null}
            </section>
          </div>
        </article>
      </section>

      <footer className="mt-10 border-t border-[#e2e8f0] bg-white py-3">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-2 px-4 text-base text-[#666c77] sm:flex-row sm:px-8">
          <p>&copy; 2026 {branding.companyName || "Hire Secure"} All right reserved</p>
          <p>powered by TechForge Innovations</p>
        </div>
      </footer>
    </main>
  );
}
