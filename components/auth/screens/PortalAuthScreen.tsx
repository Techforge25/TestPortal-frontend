"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSignInScreen } from "@/app/admin/AdminSignInPageView";
import { getCandidateTestByPasscode, loginAdmin } from "@/data.admin/shared/backendApi";
import { setAdminToken } from "@/data.admin/shared/adminAuthStorage";
import { CandidateSignInScreen } from "@/app/candidate/auth/CandidateSignInScreen";
import { saveCandidateAuthDraft } from "@/components/candidate/lib/candidateAuthDraft";
import {
  clearCandidateResultSummary,
  clearCandidateSession,
} from "@/components/candidate/lib/candidateSessionStorage";
import { AuthShell } from "@/components/shared/auth/AuthShell";
import { RoleToggle } from "@/components/shared/auth/RoleToggle";

type Role = "admin" | "candidate";

export function PortalAuthScreen() {
  const [role, setRole] = useState<Role>("admin");
  const router = useRouter();

  const handleAdminSubmit = async (payload: { email: string; password: string }) => {
    const response = await loginAdmin(payload.email, payload.password);
    setAdminToken(response.token);
    router.push("/admin");
  };
  const handleCandidateSubmit = async (payload: { email: string; testPasscode: string }) => {
    const response = await getCandidateTestByPasscode(payload.testPasscode);
    clearCandidateSession();
    clearCandidateResultSummary();
    saveCandidateAuthDraft({
      ...payload,
      testTitle: response.test?.title || "",
      testPosition: response.test?.position || "",
    });
    router.replace("/candidate");
  };

  const screen =
    role === "admin" ? (
      <AdminSignInScreen onSubmit={handleAdminSubmit} />
    ) : (
      <CandidateSignInScreen onSubmit={handleCandidateSubmit} />
    );

  return (
    <AuthShell
      rightPane={
        <div className="w-full max-w-xl">
          <RoleToggle role={role} onChange={setRole} />
          <div className="mt-4">{screen}</div>
        </div>
      }
    />
  );
}


