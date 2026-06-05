"use client";

import { useSyncExternalStore } from "react";
import { AdminDashboardScreen } from "./AdminDashboardPageView";
import { AdminSignInScreen } from "@/app/admin/AdminSignInPageView";
import { getAdminToken, setAdminToken, subscribeAdminAuth } from "@/data.admin/shared/adminAuthStorage";
import { loginAdmin } from "@/data.admin/shared/backendApi";

type AdminPageClientProps = {
  initialThemeDark?: boolean;
};

export default function AdminPageClient({ initialThemeDark = false }: AdminPageClientProps) {
  const isHydrated = useSyncExternalStore(
    subscribeAdminAuth,
    () => true,
    () => false
  );
  const storedToken = isHydrated ? getAdminToken() : null;
  const isLoggedIn = Boolean(storedToken);

  async function handleLogin(payload: { email: string; password: string; rememberMe: boolean }) {
    const response = await loginAdmin(payload.email, payload.password);
    setAdminToken(response.token);
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



