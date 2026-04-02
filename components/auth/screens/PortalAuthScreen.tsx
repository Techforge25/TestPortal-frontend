"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSignInScreen } from "@/components/admin/screens/AdminSignInScreen";
import { getCandidateTestByPasscode, loginAdmin } from "@/components/admin/lib/backendApi";
import { setAdminToken } from "@/components/admin/lib/adminAuthStorage";
import { CandidateSignInScreen } from "@/components/candidate/screens/CandidateSignInScreen";
import { saveCandidateAuthDraft } from "@/components/candidate/lib/candidateAuthDraft";
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
    await getCandidateTestByPasscode(payload.testPasscode);
    saveCandidateAuthDraft(payload);
    router.push("/candidate");
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
