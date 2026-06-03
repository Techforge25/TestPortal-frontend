"use client";

import { useState, useSyncExternalStore } from "react";
import { AdminDashboardScreen } from "./AdminDashboardPageView";
import { AdminSignInScreen } from "@/app/admin/AdminSignInPageView";
import { getAdminToken, setAdminToken } from "@/data.admin/shared/adminAuthStorage";
import { loginAdmin } from "@/data.admin/shared/backendApi";

type AdminPageClientProps = {
  initialThemeDark?: boolean;
};

export default function AdminPageClient({ initialThemeDark = false }: AdminPageClientProps) {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [token, setToken] = useState<string | null>(null);
  const storedToken = isHydrated ? getAdminToken() : null;
  const effectiveToken = token || storedToken;
  const isLoggedIn = Boolean(effectiveToken);

  async function handleLogin(payload: { email: string; password: string }) {
    const response = await loginAdmin(payload.email, payload.password);
    setAdminToken(response.token);
    setToken(response.token);
  }

  if (!isLoggedIn) {
    return (
      <main className={`flex min-h-screen items-center justify-center px-4 py-10 ${initialThemeDark ? "bg-slate-950" : "bg-[#f8fafc]"}`}>
        <AdminSignInScreen onSubmit={handleLogin} />
      </main>
    );
  }

  return <AdminDashboardScreen initialThemeDark={initialThemeDark} />;
}



