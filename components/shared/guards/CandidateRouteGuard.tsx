"use client";

import { ReactNode, useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppButton } from "@/components/shared/ui/AppButton";
import { readCandidateAuthDraft } from "@/components/candidate/lib/candidateAuthDraft";
import { readCandidateResultSummary, readCandidateSession } from "@/components/candidate/lib/candidateSessionStorage";
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
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const draft = mode === "auth_draft" ? readCandidateAuthDraft() : null;
  const session = mode === "session" ? readCandidateSession() : null;
  const summary = mode === "session" ? readCandidateResultSummary() : null;

  const isAllowed =
    mode === "auth_draft"
      ? Boolean(draft?.email && draft?.testPasscode)
      : Boolean(session?.submissionId && session?.candidateSessionToken);

  const expectedRoute = useMemo(() => {
    if (mode !== "session" || !session) return null;

    const hasTextAnswer = (value: string | undefined | null) => String(value || "").trim().length > 0;
    const sectionAnswers = Array.isArray(session.sectionAnswers) ? session.sectionAnswers : [];

    const isSectionCompleted = (sectionKey: string) => {
      const sectionConfigs = Array.isArray(session.test?.sectionConfigs)
        ? session.test.sectionConfigs.filter((item) => item.key === sectionKey)
        : [];

      if (sectionConfigs.length === 0) {
        return sectionAnswers.some((item) => item.sectionKey === sectionKey && hasTextAnswer(item.answer));
      }

      const requiredConfigs = sectionConfigs.filter((item) => item.required !== false);
      const targetConfigs = requiredConfigs.length > 0 ? requiredConfigs : sectionConfigs;

      return targetConfigs.every((config) =>
        sectionAnswers.some(
          (item) =>
            item.sectionKey === sectionKey &&
            item.itemIndex === config.index &&
            hasTextAnswer(item.answer)
        )
      );
    };

    const sections = getSupportedSections(session);
    const mcqAnswers = Array.isArray(session.mcqAnswers) ? session.mcqAnswers : [];
    const isSubmittedForCurrentSession =
      Boolean(summary?.submissionId) && summary?.submissionId === session.submissionId;

    const mcqTotal = Array.isArray(session.test?.mcqQuestions) ? session.test.mcqQuestions.length : 0;
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
    const questionIndexes = (session.test?.mcqQuestions || []).map((question, index) =>
      Number.isInteger(question?.index) ? question.index : index
    );
    const mcqDone =
      !isMcqEnabled(session) ||
      mcqTotal === 0 ||
      questionIndexes.every((questionIndex) => answerMap.has(questionIndex));

    const uiPreviewDone = !hasUiPreviewSections(session) || isSectionCompleted("ui_preview");

    const assessmentKeys = sections.filter(
      (section) => section !== "mcq" && section !== "coding" && section !== "ui_preview"
    );
    const assessmentDone =
      !hasAssessmentSections(session) ||
      assessmentKeys.every((key) => isSectionCompleted(key));

    if (isSubmittedForCurrentSession) return "/candidate/submitted";
    if (!mcqDone) return "/candidate/test";
    if (!uiPreviewDone) return "/candidate/ui-preview";
    if (!assessmentDone) return "/candidate/assessment";
    if (isCodingEnabled(session)) return "/candidate/tasks";
    return "/candidate/submitted";
  }, [mode, session, summary]);

  useEffect(() => {
    if (!isHydrated) return;
    if (mode !== "session") return;
    if (!isAllowed) {
      router.replace("/");
      return;
    }
    if (!expectedRoute) return;
    if (pathname === expectedRoute) return;

    const allowedPaths = new Set([
      "/candidate/test",
      "/candidate/ui-preview",
      "/candidate/assessment",
      "/candidate/tasks",
      "/candidate/submitted",
    ]);
    if (!allowedPaths.has(pathname || "")) return;
    router.replace(expectedRoute);
  }, [isHydrated, mode, isAllowed, expectedRoute, pathname, router]);

  if (!isHydrated) return null;

  if (mode === "session" && isAllowed && expectedRoute && pathname !== expectedRoute) {
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
