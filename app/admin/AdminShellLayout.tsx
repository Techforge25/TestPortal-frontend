"use client";

import { useMemo, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { AdminFooter } from "@/components/admin/components/AdminFooter";
import { AdminSidebar } from "@/components/admin/components/AdminSidebar";
import { AdminTopHeader } from "@/components/admin/components/AdminTopHeader";
import { getAdminToken } from "@/data.admin/shared/adminAuthStorage";
import { useAdminTheme } from "@/data.admin/shared/useAdminTheme";

function resolveShellMeta(pathname: string) {
  if (pathname.startsWith("/admin/create-test")) return { currentPage: "Create Test", activeItem: "create" as const };
  if (pathname.startsWith("/admin/test-list")) return { currentPage: "Test List", activeItem: "list" as const };
  if (pathname.startsWith("/admin/results-review")) return { currentPage: "Results Review", activeItem: "results" as const };
  if (pathname.startsWith("/admin/candidate")) return { currentPage: "Candidates", activeItem: "candidate" as const };
  if (pathname.startsWith("/admin/violations-log")) return { currentPage: "Violations Log", activeItem: "violations" as const };
  if (pathname.startsWith("/admin/notifications")) return { currentPage: "Notifications", activeItem: "notifications" as const };
  if (pathname.startsWith("/admin/settings")) return { currentPage: "Settings", activeItem: "settings" as const };
  return { currentPage: "Dashboard", activeItem: "dashboard" as const };
}

export function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const { isDark, toggleTheme } = useAdminTheme(false);

  const hasToken = isHydrated ? Boolean(getAdminToken()) : false;
  const isAdminRoot = pathname === "/admin";
  const shouldRenderShell = !isAdminRoot || hasToken;
  const shellMeta = useMemo(() => resolveShellMeta(pathname), [pathname]);

  if (!shouldRenderShell) {
    return <>{children}</>;
  }

  return (
    <main className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-[#f8fafc]"}`}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar isDark={isDark} activeItem={shellMeta.activeItem} />
        <section className="flex w-full flex-col">
          <AdminTopHeader isDark={isDark} onToggleTheme={toggleTheme} currentPage={shellMeta.currentPage} />
          <div className="flex-1">{children}</div>
          <AdminFooter isDark={isDark} />
        </section>
      </div>
    </main>
  );
}