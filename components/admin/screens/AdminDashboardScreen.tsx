"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminStatCard, type AdminStatCardData } from "@/components/admin/components/AdminStatCard";
import { AdminFooter } from "@/components/admin/components/AdminFooter";
import { AdminSidebar } from "@/components/admin/components/AdminSidebar";
import { AdminTopHeader } from "@/components/admin/components/AdminTopHeader";
import { useAdminTheme } from "@/components/admin/hooks/useAdminTheme";
import { getAdminToken } from "@/components/admin/lib/adminAuthStorage";
import { getAdminDashboardData, type AdminDashboardResponse } from "@/components/admin/lib/backendApi";
import { AppButton } from "@/components/shared/ui/AppButton";
import { AppDropdown } from "@/components/shared/ui/AppDropdown";
import { useRealtimeSubscription } from "@/components/shared/realtime/useRealtimeSubscription";

function FullSpectrumIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      className="size-8"
      fill="#4F46E5"
      aria-hidden="true"
    >
      <path d="M330.17-293.83q9.83-9.84 9.83-23.5 0-13.67-9.83-23.5-9.84-9.84-23.5-9.84-13.67 0-23.5 9.84-9.84 9.83-9.84 23.5 0 13.66 9.84 23.5Q293-284 306.67-284q13.66 0 23.5-9.83Zm0-162.67Q340-466.33 340-480t-9.83-23.5q-9.84-9.83-23.5-9.83-13.67 0-23.5 9.83-9.84 9.83-9.84 23.5t9.84 23.5q9.83 9.83 23.5 9.83 13.66 0 23.5-9.83Zm0-162.67Q340-629 340-642.67q0-13.66-9.83-23.5-9.84-9.83-23.5-9.83-13.67 0-23.5 9.83-9.84 9.84-9.84 23.5 0 13.67 9.84 23.5 9.83 9.84 23.5 9.84 13.66 0 23.5-9.84ZM434.67-284h242.66v-66.67H434.67V-284Zm0-162.67h242.66v-66.66H434.67v66.66Zm0-162.66h242.66V-676H434.67v66.67ZM186.67-120q-27 0-46.84-19.83Q120-159.67 120-186.67v-586.66q0-27 19.83-46.84Q159.67-840 186.67-840h586.66q27 0 46.84 19.83Q840-800.33 840-773.33v586.66q0 27-19.83 46.84Q800.33-120 773.33-120H186.67Zm0-66.67h586.66v-586.66H186.67v586.66Zm0-586.66v586.66-586.66Z" />
    </svg>
  );
}

function UncompromisedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      className="size-8"
      fill="#2563EB"
      aria-hidden="true"
    >
      <path d="M188.33-473.33H320q9 0 17.33 4.5 8.34 4.5 12.67 13.5l50 100.66 130-260.66q9-19 30-19t30 19l71 142h110.67Q759.33-584 676.67-659 594-734 480-734q-114 0-196.67 75-82.66 75-95 185.67Zm488 251.33q82.34-74.67 94.67-184.67H640q-9 0-17.33-4.5-8.34-4.5-12.67-13.5l-50-100.66-130 260.66q-9 19-30 19t-30-19l-71-142H189q12.33 110 94.67 184.67Q366-147.33 480-147.33q114 0 196.33-74.67ZM340.5-109.17q-65.5-28.5-114.5-77.5t-77.5-114.5q-28.5-65.5-28.5-139.5h66.67q0 122 85.66 207.67Q358-147.33 480-147.33q122 0 207.67-85.67 85.66-85.67 85.66-207.67H840q0 74-28.5 139.5T734-186.67q-49 49-114.5 77.5T480-80.67q-74 0-139.5-28.5ZM120-440.67q0-74 28.5-139.5t77.5-114.5q49-49 114.5-77.5t139.5-28.5q65.33 0 123.67 21.67 58.33 21.67 105.66 61L762-770.67 808.67-724 756-671.33Q792.67-628 816.33-571 840-514 840-440.67h-66.67q0-122-85.66-207.66Q602-734 480-734q-122 0-207.67 85.67-85.66 85.66-85.66 207.66H120Zm240-412.66V-920h240v66.67H360ZM272.33-233q-85.66-85.67-85.66-207.67 0-122 85.66-207.66Q358-734 480-734q122 0 207.67 85.67 85.66 85.66 85.66 207.66T687.67-233Q602-147.33 480-147.33q-122 0-207.67-85.67ZM480-440Z" />
    </svg>
  );
}

function TotalTestIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      className="size-8"
      fill="#16A34A"
      aria-hidden="true"
    >
      <path d="M38.67-160v-100q0-34.67 17.83-63.17T105.33-366q69.34-31.67 129.67-46.17 60.33-14.5 123.67-14.5 63.33 0 123.33 14.5T611.33-366q31 14.33 49.17 42.83T678.67-260v100h-640Zm706.66 0v-102.67q0-56.66-29.5-97.16t-79.16-66.84q63 7.34 118.66 22.5 55.67 15.17 94 35.5 34 19.34 53 46.17 19 26.83 19 59.83V-160h-176ZM249-524.33Q205.33-568 205.33-634T249-743.67q43.67-43.66 109.67-43.66t109.66 43.66Q512-700 512-634t-43.67 109.67q-43.66 43.66-109.66 43.66T249-524.33Zm439.33 0q-43.66 43.66-109.66 43.66-11 0-25.67-1.83-14.67-1.83-25.67-5.5 25-27.33 38.17-64.67Q578.67-590 578.67-634t-13.17-80q-13.17-36-38.17-66 12-3.67 25.67-5.5 13.67-1.83 25.67-1.83 66 0 109.66 43.66Q732-700 732-634t-43.67 109.67Zm-583 297.66H612V-260q0-14.33-8.17-27.33-8.16-13-20.5-18.67-66-30.33-117-42.17-51-11.83-107.66-11.83-56.67 0-108 11.83-51.34 11.84-117.34 42.17-12.33 5.67-20.16 18.67-7.84 13-7.84 27.33v33.33Zm315.17-345.5Q445.33-597 445.33-634t-24.83-61.83q-24.83-24.84-61.83-24.84t-61.84 24.84Q272-671 272-634t24.83 61.83q24.84 24.84 61.84 24.84t61.83-24.84Zm-61.83 345.5Zm0-407.33Z" />
    </svg>
  );
}

function CompletedTestsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      className="size-8"
      fill="#4B5563"
      aria-hidden="true"
    >
      <path d="M422-297.33 704.67-580l-49.34-48.67L422-395.33l-118-118-48.67 48.66L422-297.33ZM480-80q-82.33 0-155.33-31.5-73-31.5-127.34-85.83Q143-251.67 111.5-324.67T80-480q0-83 31.5-156t85.83-127q54.34-54 127.34-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82.33-31.5 155.33-31.5 73-85.5 127.34Q709-143 636-111.5T480-80Zm0-66.67q139.33 0 236.33-97.33t97-236q0-139.33-97-236.33t-236.33-97q-138.67 0-236 97-97.33 97-97.33 236.33 0 138.67 97.33 236 97.33 97.33 236 97.33ZM480-480Z" />
    </svg>
  );
}

function AverageScoreIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      className="size-8"
      fill="#D97706"
      aria-hidden="true"
    >
      <path d="M127.33-240 80-287.33l293.33-293.34L538-416l230-229.33H648.67V-712H880v231.33h-66v-116.66L537.33-320.67 372.67-485.33 127.33-240Z" />
    </svg>
  );
}

function ViolationsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      className="size-8"
      fill="#DC2626"
      aria-hidden="true"
    >
      <path d="m40-120 440-760 440 760H40Zm115.33-66.67h649.34L480-746.67l-324.67 560Zm351.17-60.95q9.5-9.61 9.5-23.83 0-14.22-9.62-23.72-9.61-9.5-23.83-9.5-14.22 0-23.72 9.62-9.5 9.62-9.5 23.83 0 14.22 9.62 23.72 9.62 9.5 23.83 9.5 14.22 0 23.72-9.62ZM449.33-352H516v-216h-66.67v216ZM480-466.67Z" />
    </svg>
  );
}

type PerformancePeriod = "daily" | "weekly" | "yearly";

const periodOptions: { value: PerformancePeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "yearly", label: "Yearly" },
];

const DASHBOARD_CACHE_KEY = "admin_dashboard_cache_v1";

function readCachedDashboard(): AdminDashboardResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminDashboardResponse;
  } catch {
    return null;
  }
}

function writeCachedDashboard(data: AdminDashboardResponse) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore cache write errors.
  }
}

type AdminDashboardScreenProps = {
  initialThemeDark?: boolean;
};

export function AdminDashboardScreen({ initialThemeDark = false }: AdminDashboardScreenProps) {
  const router = useRouter();
  const { isDark, toggleTheme } = useAdminTheme(initialThemeDark);
  const [token, setToken] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PerformancePeriod>("weekly");
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState("");
  const hasCachedOnMountRef = useRef(false);
  const initialFetchHandledRef = useRef(false);

  const topStats: AdminStatCardData[] = useMemo(
    () => [
      { label: "Total Tests", value: String(dashboard?.stats.totalTests || 0), trend: "+0%", iconBg: "bg-[#EEF2FF]", icon: <FullSpectrumIcon /> },
      { label: "Active Tests", value: String(dashboard?.stats.activeTests || 0), trend: "+0%", iconBg: "bg-[#EFF6FF]", icon: <UncompromisedIcon /> },
      { label: "Total Candidates", value: String(dashboard?.stats.totalCandidates || 0), trend: "+0%", iconBg: "bg-[#F0FDF4]", icon: <TotalTestIcon /> },
    ],
    [dashboard]
  );

  const secondaryStats: AdminStatCardData[] = useMemo(
    () => [
      { label: "Completed Tests", value: String(dashboard?.stats.completedTests || 0), trend: "+0%", iconBg: "bg-[#F3F4F6]", icon: <CompletedTestsIcon /> },
      { label: "Average Score", value: `${dashboard?.stats.averageScore || 0}%`, trend: "+0%", iconBg: "bg-[#FFFBEB]", icon: <AverageScoreIcon /> },
      { label: "Violations", value: String(dashboard?.stats.violations || 0), trend: "+0%", trendDown: false, iconBg: "bg-[#FEF2F2]", icon: <ViolationsIcon /> },
    ],
    [dashboard]
  );

  const performanceData = dashboard?.performance || { daily: [], weekly: [], yearly: [] };
  const activities = dashboard?.recentActivities || [];
  const rows = dashboard?.recentResults || [];
  const currentDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    []
  );

  useEffect(() => {
    const cached = readCachedDashboard();
    if (cached) {
      setDashboard(cached);
      hasCachedOnMountRef.current = true;
    }

    const currentToken = getAdminToken();
    setToken(currentToken);
    if (!currentToken) {
      setAuthError("Admin session missing. Please login again.");
      return;
    }
    setAuthError("");
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const response = await getAdminDashboardData(token);
      setDashboard(response);
      writeCachedDashboard(response);
      setError("");
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Failed to load dashboard";
      setError(message);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (!initialFetchHandledRef.current) {
      initialFetchHandledRef.current = true;
      if (hasCachedOnMountRef.current) return;
    }
    void loadDashboard();
  }, [loadDashboard, token]);

  useRealtimeSubscription({
    token,
    events: ["admin:dashboard.updated", "admin:data.changed"],
    onEvent: async () => {
      if (document.visibilityState === "visible") {
        await loadDashboard();
      }
    },
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (!token) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadDashboard();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [loadDashboard, token]);

  return (
    <main className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-[#f8fafc]"}`}>
      <div className="flex w-full">
        <AdminSidebar isDark={isDark} activeItem="dashboard" />

        <section className="flex w-full flex-col">
          <AdminTopHeader isDark={isDark} onToggleTheme={toggleTheme} currentPage="Dashboard" />

          <div className="flex-1 space-y-8 p-6">
            {authError || error ? <p className="text-sm text-red-600">{authError || error}</p> : null}
            <section className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className={`text-5xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                  Dashboard
                </h1>
                <p className={`mt-1 text-2xl [zoom:0.5] ${isDark ? "text-slate-400" : "text-[#666c77]"}`}>
                  {currentDateLabel}
                </p>
              </div>
              <div className="flex w-full max-w-[465px] gap-3">
                <AppButton
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => router.push("/admin/candidate")}
                  leftIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 -960 960 960"
                      className="size-6 fill-current"
                      aria-hidden="true"
                    >
                      <path d="M38.67-160v-100q0-34.67 17.83-63.17T105.33-366q69.34-31.67 129.67-46.17 60.33-14.5 123.67-14.5 63.33 0 123.33 14.5T611.33-366q31 14.33 49.17 42.83T678.67-260v100h-640Zm706.66 0v-102.67q0-56.66-29.5-97.16t-79.16-66.84q63 7.34 118.66 22.5 55.67 15.17 94 35.5 34 19.34 53 46.17 19 26.83 19 59.83V-160h-176ZM249-524.33Q205.33-568 205.33-634T249-743.67q43.67-43.66 109.67-43.66t109.66 43.66Q512-700 512-634t-43.67 109.67q-43.66 43.66-109.66 43.66T249-524.33Zm439.33 0q-43.66 43.66-109.66 43.66-11 0-25.67-1.83-14.67-1.83-25.67-5.5 25-27.33 38.17-64.67Q578.67-590 578.67-634t-13.17-80q-13.17-36-38.17-66 12-3.67 25.67-5.5 13.67-1.83 25.67-1.83 66 0 109.66 43.66Q732-700 732-634t-43.67 109.67Zm-583 297.66H612V-260q0-14.33-8.17-27.33-8.16-13-20.5-18.67-66-30.33-117-42.17-51-11.83-107.66-11.83-56.67 0-108 11.83-51.34 11.84-117.34 42.17-12.33 5.67-20.16 18.67-7.84 13-7.84 27.33v33.33Zm315.17-345.5Q445.33-597 445.33-634t-24.83-61.83q-24.83-24.84-61.83-24.84t-61.84 24.84Q272-671 272-634t24.83 61.83q24.84 24.84 61.84 24.84t61.83-24.84Zm-61.83 345.5Zm0-407.33Z" />
                    </svg>
                  }
                >
                  View Candidates
                </AppButton>
                <AppButton
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  onClick={() => router.push("/admin/create-test")}
                  leftIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 -960 960 960"
                      className="size-6 fill-current"
                      aria-hidden="true"
                    >
                      <path d="M446.67-322h66.66v-124H638v-66.67H513.33v-124.66h-66.66v124.66h-124V-446h124v124ZM480-80q-12.67 0-24.83-4.83Q443-89.67 433.33-99l-333-333.33q-9-10-14.33-22.17-5.33-12.17-5.33-24.83 0-12.67 5.33-25.17 5.33-12.5 14.33-21.5l333-334q10-10 22-14.67 12-4.66 25-4.66t25.34 4.66Q518-870 527-860l333.33 334q9.67 9.33 14.67 21.67 5 12.33 5 25 0 12.66-4.83 24.83-4.84 12.17-14.84 22.17L527-99q-9.07 9.09-21.44 14.04Q493.19-80 480-80Zm0-66.67 333-332.66-333-333.34-332.33 333.34L480-146.67Zm.67-333.33Z" />
                    </svg>
                  }
                >
                  Create Test
                </AppButton>
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-3">
              {topStats.map((card) => (
                <AdminStatCard key={card.label} card={card} isDark={isDark} />
              ))}
            </section>

            <section className="grid gap-6 md:grid-cols-3">
              {secondaryStats.map((card) => (
                <AdminStatCard key={`${card.label}-${card.trend}`} card={card} isDark={isDark} />
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[2.2fr_1fr]">
              <article
                className={`rounded-xl border p-5 ${
                  isDark ? "border-slate-700 bg-slate-800" : "border-[#e2e8f0] bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className={`text-[32px] font-semibold tracking-[-0.48px] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                      Candidate Performance Overview
                    </h2>
                    <p className={`${isDark ? "text-slate-300" : "text-[#666c77]"}`}>
                      Average Scores across recent test
                    </p>
                  </div>
                  <AppDropdown
                    value={selectedPeriod}
                    onChange={(value) => setSelectedPeriod(value as PerformancePeriod)}
                    options={periodOptions.map((option) => ({ value: option.value, label: option.label }))}
                    ariaLabel="Select performance range"
                    className={`h-10 min-w-[132px] rounded-[10px] border shadow-sm transition-all duration-200 ${
                      isDark
                        ? "border-slate-600 bg-slate-800 text-slate-200 hover:border-slate-500 hover:bg-slate-700/80"
                        : "border-[#d6deee] bg-[#f8faff] text-[#475569] hover:border-[#b9c8ea] hover:bg-white"
                    }`}
                    triggerClassName={`bg-transparent px-3 pr-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 ${
                      isDark
                        ? "focus-visible:ring-slate-500/60"
                        : "focus-visible:ring-[#1f3a8a]/30"
                    }`}
                    chevronClassName={isDark ? "text-slate-300" : "text-[#64748b]"}
                    menuClassName={`rounded-[10px] border shadow-lg ${
                      isDark ? "border-slate-600 bg-slate-800" : "border-[#d6deee] bg-white"
                    }`}
                    optionClassName={`px-3 py-2 text-sm transition-colors ${
                      isDark ? "text-slate-200 hover:bg-slate-700/70" : "text-[#475569] hover:bg-[#f4f7ff]"
                    }`}
                    selectedOptionClassName={isDark ? "bg-slate-700 text-slate-100" : "bg-[#e9efff] text-[#1f3a8a]"}
                  />
                </div>

                <div className="mt-6">
                  <div className="relative h-[300px]">
                    <div className="pointer-events-none absolute inset-0 z-0 flex flex-col justify-between">
                      {[100, 75, 50, 25, 0].map((line) => (
                        <div key={line} className="flex items-center gap-2">
                          <span className={`w-10 text-sm ${isDark ? "text-slate-300" : "text-[#475569]"}`}>
                            {line}%
                          </span>
                          <div className={`h-px flex-1 ${isDark ? "bg-slate-700" : line === 0 ? "bg-[#cfd8ea]" : "bg-[#e2e8f0]"}`} />
                        </div>
                      ))}
                    </div>

                    <div className="relative z-[2] grid h-full grid-cols-7 items-end gap-5 pl-12">
                      {(performanceData[selectedPeriod] || []).map((bar) => (
                        <div key={bar.day} className="flex h-full items-end">
                          <div className="w-full rounded-t-xl bg-[#1f3a8a]" style={{ height: `${bar.value}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-7 gap-5 pl-12">
                    {(performanceData[selectedPeriod] || []).map((bar) => (
                      <span
                        key={`${bar.day}-label`}
                        className={`text-center text-sm ${isDark ? "text-slate-300" : "text-[#475569]"}`}
                      >
                        {bar.day}
                      </span>
                    ))}
                  </div>
                </div>
              </article>

              <article className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={`text-[32px] font-semibold tracking-[-0.48px] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                    Recent Activity
                  </h3>
                  <AppButton
                    variant="ghost"
                    size="sm"
                    className={isDark ? "text-slate-300" : "text-[#475569]"}
                    // rightIcon={<ChevronDownIcon />}
                  >
                    View All
                  </AppButton>
                </div>
                {activities.map((item, index) => (
                  <div
                    key={`${item.title}-${item.time}-${index}`}
                    className={`rounded-lg border p-3 ${
                      isDark ? "border-slate-700 bg-slate-800" : "border-[#e2e8f0] bg-white"
                    }`}
                  >
                    <p className={isDark ? "text-slate-100" : "text-[#475569]"}>{item.title}</p>
                    {item.sub ? <p className="text-xs text-[#1f3a8a]">{item.sub}</p> : null}
                    <p className={`text-xs ${isDark ? "text-slate-400" : "text-[#475569]"}`}>{item.time}</p>
                  </div>
                ))}
              </article>
            </section>

            <section
              className={`rounded-3xl border px-6 py-9 ${
                isDark ? "border-slate-700 bg-slate-800" : "border-[#e2e8f0] bg-white"
              }`}
            >
              <h2 className={`text-[40px] font-semibold tracking-[-0.6px] [zoom:0.55] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                Test List
              </h2>
              <div className={`mt-4 grid grid-cols-6 gap-5 px-4 py-5 text-center text-lg ${isDark ? "bg-slate-700 text-slate-300" : "bg-[#f9fafb] text-[#666c77]"}`}>
                <p>Candidate</p>
                <p>Position</p>
                <p>Test</p>
                <p>Score</p>
                <p>Status</p>
                <p>Date</p>
              </div>

              <div className="space-y-6 pt-6">
                {rows.map((row) => (
                  <div key={`${row.candidate}-${row.date}`} className="grid grid-cols-6 items-center gap-5 text-center">
                    <p className={`font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{row.candidate}</p>
                    <p className={isDark ? "text-slate-300" : "text-[#666c77]"}>{row.position}</p>
                    <p className={isDark ? "text-slate-300" : "text-[#666c77]"}>{row.test}</p>
                    <p className={`font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{row.score}</p>
                    <p
                      className={`mx-auto min-w-[102px] rounded-3xl border px-4 py-1 ${
                        row.status === "Passed"
                          ? "border-[#16a34a] bg-[#f8fafc] text-[#16a34a]"
                          : row.status === "Failed"
                            ? "border-[#fecaca] bg-[#fef2f2] text-[#dc2626]"
                            : "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]"
                      }`}
                    >
                      {row.status}
                    </p>
                    <p className={isDark ? "text-slate-300" : "text-[#666c77]"}>{row.date ? new Date(row.date).toLocaleDateString() : "-"}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <AdminFooter isDark={isDark} />
        </section>
      </div>
    </main>
  );
}
