"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppButton } from "@/components/shared/ui/AppButton";
import { readCandidateAuthDraft } from "@/components/candidate/lib/candidateAuthDraft";
import { useCandidateRealtimeState } from "@/components/candidate/hooks/useCandidateRealtimeState";
import {
  getSupportedSections,
  hasAssessmentSections,
  hasUiPreviewSections,
  isCodingEnabled,
  isMcqEnabled,
} from "@/components/candidate/lib/assessmentFlow";

type CandidateRouteGuardProps = {
  children: ReactNode;
  mode: "auth_draft" | "session";
};

export function CandidateRouteGuard({ children, mode }: CandidateRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, summary } = useCandidateRealtimeState();
  const isHydrated = true;

  const draft = mode === "auth_draft" ? readCandidateAuthDraft() : null;
  const effectiveSession = mode === "session" ? session : null;
  const effectiveSummary = mode === "session" ? summary : null;

  const isAllowed =
    mode === "auth_draft"
      ? Boolean(draft?.email && draft?.testPasscode)
      : Boolean(session?.submissionId && session?.candidateSessionToken);

  const expectedRoute = useMemo(() => {
    if (mode !== "session" || !effectiveSession) return null;

    const hasTextAnswer = (value: string | undefined | null) => String(value || "").trim().length > 0;
    const sectionAnswers = Array.isArray(effectiveSession.sectionAnswers) ? effectiveSession.sectionAnswers : [];

    const isSectionCompleted = (sectionKey: string) => {
      const sectionConfigs = Array.isArray(effectiveSession.test?.sectionConfigs)
        ? effectiveSession.test.sectionConfigs.filter((item) => item.key === sectionKey)
        : [];

      if (sectionConfigs.length === 0) {
        return sectionAnswers.some((item) => item.sectionKey === sectionKey && hasTextAnswer(item.answer));
      }

      const requiredConfigs = sectionConfigs.filter((item) => item.required !== false);
      const targetConfigs = requiredConfigs.length > 0 ? requiredConfigs : sectionConfigs;
      const completedCount = sectionAnswers.filter(
        (item) => item.sectionKey === sectionKey && hasTextAnswer(item.answer)
      ).length;
      return completedCount >= targetConfigs.length;
    };

    const sections = getSupportedSections(effectiveSession);
    const mcqAnswers = Array.isArray(effectiveSession.mcqAnswers) ? effectiveSession.mcqAnswers : [];
    const isSubmittedForCurrentSession =
      Boolean(effectiveSummary?.submissionId) && effectiveSummary?.submissionId === effectiveSession.submissionId;

    const mcqTotal = Array.isArray(effectiveSession.test?.mcqQuestions) ? effectiveSession.test.mcqQuestions.length : 0;
    const answerMap = new Map<number, number>();
    mcqAnswers.forEach((item) => {
      if (
        Number.isInteger(item?.questionIndex) &&
        Number.isInteger(item?.selectedOptionIndex) &&
        item.selectedOptionIndex >= 0
      ) {
        answerMap.set(item.questionIndex, item.selectedOptionIndex);
      }
    });
    const mcqSubmitted = Boolean(effectiveSession.mcqSectionSubmitted);
    const mcqDone = !isMcqEnabled(effectiveSession) || mcqSubmitted || (mcqTotal > 0 && answerMap.size >= mcqTotal);

    const uiPreviewDone = !hasUiPreviewSections(effectiveSession) || isSectionCompleted("ui_preview");

    const assessmentKeys = sections.filter(
      (section) => section !== "mcq" && section !== "coding" && section !== "ui_preview"
    );
    const assessmentDone =
      !hasAssessmentSections(effectiveSession) ||
      assessmentKeys.every((key) => isSectionCompleted(key));

    if (isSubmittedForCurrentSession) return "/candidate/submitted";
    if (!mcqDone) return "/candidate/test";
    if (!uiPreviewDone) return "/candidate/ui-preview";
    if (!assessmentDone) return "/candidate/assessment";
    if (isCodingEnabled(effectiveSession)) return "/candidate/tasks";
    return "/candidate/submitted";
  }, [mode, effectiveSession, effectiveSummary]);

  const canAccessCurrentPath = useMemo(() => {
    if (mode !== "session" || !effectiveSession) return false;
    if (!pathname) return false;
    if (pathname === "/candidate/pre-test") return true;

    const sectionAnswers = Array.isArray(effectiveSession.sectionAnswers) ? effectiveSession.sectionAnswers : [];
    const mcqAnswers = Array.isArray(effectiveSession.mcqAnswers) ? effectiveSession.mcqAnswers : [];
    const sections = getSupportedSections(effectiveSession);

    const isSubmittedForCurrentSession =
      Boolean(effectiveSummary?.submissionId) && effectiveSummary?.submissionId === effectiveSession.submissionId;

    const mcqTotal = Array.isArray(effectiveSession.test?.mcqQuestions) ? effectiveSession.test.mcqQuestions.length : 0;
    const answerMap = new Map<number, number>();
    mcqAnswers.forEach((item) => {
      if (
        Number.isInteger(item?.questionIndex) &&
        Number.isInteger(item?.selectedOptionIndex) &&
        item.selectedOptionIndex >= 0
      ) {
        answerMap.set(item.questionIndex, item.selectedOptionIndex);
      }
    });
    const mcqSubmitted = Boolean(effectiveSession.mcqSectionSubmitted);
    const mcqDone = !isMcqEnabled(effectiveSession) || mcqSubmitted || (mcqTotal > 0 && answerMap.size >= mcqTotal);

    const uiDone =
      !hasUiPreviewSections(effectiveSession) ||
      sectionAnswers.some((item) => item.sectionKey === "ui_preview" && String(item.answer || "").trim().length > 0);

    const assessmentKeys = sections.filter(
      (section) => section !== "mcq" && section !== "coding" && section !== "ui_preview"
    );
    const assessmentDone =
      !hasAssessmentSections(effectiveSession) ||
      assessmentKeys.every((key) =>
        sectionAnswers.some((item) => item.sectionKey === key && String(item.answer || "").trim().length > 0)
      );

    if (pathname === "/candidate/test") return !isSubmittedForCurrentSession && isMcqEnabled(effectiveSession);
    if (pathname === "/candidate/ui-preview") return !isSubmittedForCurrentSession && hasUiPreviewSections(effectiveSession) && mcqDone;
    if (pathname === "/candidate/assessment")
      return (
        !isSubmittedForCurrentSession &&
        hasAssessmentSections(effectiveSession) &&
        mcqDone &&
        (!hasUiPreviewSections(effectiveSession) || uiDone)
      );
    if (pathname === "/candidate/tasks")
      return (
        !isSubmittedForCurrentSession &&
        isCodingEnabled(effectiveSession) &&
        mcqDone &&
        (!hasUiPreviewSections(effectiveSession) || uiDone) &&
        (!hasAssessmentSections(effectiveSession) || assessmentDone)
      );
    if (pathname === "/candidate/submitted") return isSubmittedForCurrentSession;
    return false;
  }, [mode, effectiveSession, pathname, effectiveSummary]);

  useEffect(() => {
    if (!isHydrated) return;
    if (mode !== "session") return;
    if (!isAllowed) {
      router.replace("/");
      return;
    }
    if (pathname === "/candidate/pre-test") return;
    if (!expectedRoute) return;
    if (canAccessCurrentPath) return;
    if (pathname === expectedRoute) return;

    const allowedPaths = new Set([
      "/candidate/pre-test",
      "/candidate/test",
      "/candidate/ui-preview",
      "/candidate/assessment",
      "/candidate/tasks",
      "/candidate/submitted",
    ]);
    if (!allowedPaths.has(pathname || "")) return;
    router.replace(expectedRoute);
  }, [isHydrated, mode, isAllowed, expectedRoute, pathname, router, canAccessCurrentPath]);

  if (!isHydrated) return null;

  if (mode === "session" && isAllowed && expectedRoute && !canAccessCurrentPath) {
    return null;
  }

  if (isAllowed) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4">
      <div className="w-full max-w-[500px] rounded-[12px] border border-[#dbe3ef] bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.26)]">
        <h3 className="text-[24px] font-semibold text-[#0f172a]">Candidate Access Restricted</h3>
        <p className="mt-2 text-sm text-[#475569]">
          Please start from candidate sign in with valid email and test passcode.
        </p>
        <div className="mt-5 flex justify-end">
          <AppButton
            type="button"
            variant="primary"
            className="h-10 rounded-[8px] px-5"
            onClick={() => router.replace("/")}
          >
            Go To Login
          </AppButton>
        </div>
      </div>
    </div>
  );
}
