"use client";

import { ReactNode, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/shared/ui/AppButton";
import { readCandidateAuthDraft } from "@/components/candidate/lib/candidateAuthDraft";
import { readCandidateSession } from "@/components/candidate/lib/candidateSessionStorage";

type CandidateRouteGuardProps = {
  children: ReactNode;
  mode: "auth_draft" | "session";
};

export function CandidateRouteGuard({ children, mode }: CandidateRouteGuardProps) {
  const router = useRouter();
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!isHydrated) return null;

  const draft = mode === "auth_draft" ? readCandidateAuthDraft() : null;
  const session = mode === "session" ? readCandidateSession() : null;

  const isAllowed =
    mode === "auth_draft"
      ? Boolean(draft?.email && draft?.testPasscode)
      : Boolean(session?.submissionId && session?.candidateSessionToken);

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
