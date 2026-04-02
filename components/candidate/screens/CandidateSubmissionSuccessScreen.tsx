"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePublicBranding } from "@/components/admin/lib/runtimeSettings";
import { AppButton } from "@/components/shared/ui/AppButton";
import {
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

export function CandidateSubmissionSuccessScreen() {
  const router = useRouter();
  const branding = usePublicBranding();
  const summary = useMemo(() => readCandidateResultSummary(), []);

  const mcqScore = summary?.mcqScore ?? 40;
  const mcqTotal = summary?.mcqTotal ?? 50;
  const submittedLabel = summary?.submittedAt
    ? new Date(summary.submittedAt).toLocaleString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Wednesday, March 4, 2026 at 11:27 PM";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#d5e1db] via-[#b8c6d0] to-[#95abd6] px-4 py-8">
      <section className="w-full max-w-[720px] text-center">
        <div className="mx-auto flex size-[64px] items-center justify-center rounded-full bg-[#1f3a8a] shadow-[0_12px_28px_rgba(31,58,138,0.35)]">
          <CheckBadgeIcon />
        </div>

        <h1 className="mt-6 text-[36px] font-semibold tracking-[-0.54px] text-[#1e293b] [zoom:0.58]">Test Submitted Successfully!</h1>
        <p className="mt-2 text-sm text-[#475569]">Thank you for completing the assessment</p>

        <article className="mx-auto mt-7 w-full max-w-[470px] rounded-[12px] border border-[#dbe3ef] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[10px] bg-[#eef2ff] p-3 text-left">
              <p className="flex items-center gap-2 text-xs font-medium text-[#4f46e5]">
                <ClipboardIcon />
                MCQ Score
              </p>
              <p className="mt-1 text-[18px] font-semibold text-[#0f172a]">{`${mcqScore}/${mcqTotal}`}</p>
            </div>
            <div className="rounded-[10px] bg-[#fff7ed] p-3 text-left">
              <p className="flex items-center gap-2 text-xs font-medium text-[#d97706]">
                <CodeIcon />
                Coding
              </p>
              <p className="mt-1 text-[14px] font-semibold text-[#0f172a]">Under Review</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-[#e2e8f0] pt-3 text-xs text-[#64748b]">
            <ClockIcon />
            <span className="font-medium">Submitted:</span>
            <span>{submittedLabel}</span>
          </div>
        </article>

        <article className="mx-auto mt-4 w-full max-w-[470px] rounded-[10px] border border-[#dbe3ef] bg-white p-4 text-sm text-[#475569] shadow-[0_10px_24px_rgba(15,23,42,0.1)]">
          <p>
            Results will be communicated within <span className="font-semibold text-[#0f172a]">2-3 business days</span>.
          </p>
          <p className="mt-1">Please check your email for updates.</p>
        </article>

        <div className="mt-6">
          <AppButton
            onClick={() => {
              clearCandidateResultSummary();
              router.push("/");
            }}
            className="h-11 rounded-[8px] px-8"
          >
            Back To Login
          </AppButton>
        </div>

        <p className="mt-5 text-xs text-[#f8fafc]">{`Powered by ${branding.companyName || "TechForge Innovation"}`}</p>
      </section>
    </main>
  );
}
