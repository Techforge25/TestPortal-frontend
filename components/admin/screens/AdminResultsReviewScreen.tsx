"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { AdminFooter } from "@/components/admin/components/AdminFooter";
import { AdminSidebar } from "@/components/admin/components/AdminSidebar";
import { AdminTopHeader } from "@/components/admin/components/AdminTopHeader";
import { useAdminTheme } from "@/components/admin/hooks/useAdminTheme";
import { getAdminToken } from "@/components/admin/lib/adminAuthStorage";
import { listAdminReviews, type AdminReviewRow } from "@/components/admin/lib/backendApi";
import { AppPagination } from "@/components/shared/ui/AppPagination";
import { AppSegmentedControl } from "@/components/shared/ui/AppSegmentedControl";
import { AppSearchBar } from "@/components/shared/ui/AppSearchBar";

type ReviewTab = "pending" | "all" | "completed";
type ReviewSummary = { pending: number; reviewedToday: number; passed: number; failed: number };

const REVIEWS_POLL_MS = 30000;
const REVIEWS_CACHE_KEY = "admin_reviews_cache_v1";

function readCachedReviews(): { rows: AdminReviewRow[]; summary: ReviewSummary } {
  if (typeof window === "undefined") {
    return { rows: [], summary: { pending: 0, reviewedToday: 0, passed: 0, failed: 0 } };
  }
  try {
    const raw = window.sessionStorage.getItem(REVIEWS_CACHE_KEY);
    if (!raw) {
      return { rows: [], summary: { pending: 0, reviewedToday: 0, passed: 0, failed: 0 } };
    }
    const parsed = JSON.parse(raw) as { rows?: AdminReviewRow[]; summary?: ReviewSummary };
    return {
      rows: Array.isArray(parsed?.rows) ? parsed.rows : [],
      summary:
        parsed?.summary && typeof parsed.summary === "object"
          ? parsed.summary
          : { pending: 0, reviewedToday: 0, passed: 0, failed: 0 },
    };
  } catch {
    return { rows: [], summary: { pending: 0, reviewedToday: 0, passed: 0, failed: 0 } };
  }
}

function writeCachedReviews(rows: AdminReviewRow[], summary: ReviewSummary) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(REVIEWS_CACHE_KEY, JSON.stringify({ rows, summary }));
  } catch {
    // Ignore cache write errors.
  }
}

function getReviewStatusBadge(status: AdminReviewRow["reviewStatus"], isDark: boolean) {
  if (status === "Passed") {
    return isDark
      ? "border-emerald-700 bg-emerald-950 text-emerald-300"
      : "border-emerald-500 bg-emerald-50 text-emerald-700";
  }
  if (status === "Failed") {
    return isDark ? "border-red-700 bg-red-950 text-red-300" : "border-red-500 bg-red-50 text-red-700";
  }
  if (status === "On Hold") {
    return isDark
      ? "border-amber-700 bg-amber-950 text-amber-300"
      : "border-amber-500 bg-amber-50 text-amber-700";
  }
  if (status === "Shortlisted") {
    return isDark
      ? "border-blue-700 bg-blue-950 text-blue-300"
      : "border-blue-500 bg-blue-50 text-blue-700";
  }
  return isDark
    ? "border-slate-600 bg-slate-800 text-slate-200"
    : "border-slate-300 bg-slate-100 text-slate-700";
}

function ReviewArrow() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4">
      <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6 text-[#4f46e5]">
      <rect x="4" y="3.5" width="16" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 8.5H16" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12H16" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 15.5H12.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ReviewedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6 text-[#2563eb]">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 12L11 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PassedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6 text-[#16a34a]">
      <path d="M7 5.5H17V8.5C17 11.2 14.8 13.5 12 13.5C9.2 13.5 7 11.2 7 8.5V5.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.5 13.8V17.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14.5 13.8V17.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 17.5H16" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 7H7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M17 7H20" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function FailedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6 text-[#dc2626]">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 9L15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 9L9 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SummaryCard({
  value,
  label,
  icon,
  iconBg,
  isDark,
}: {
  value: string;
  label: string;
  icon: ReactNode;
  iconBg: string;
  isDark: boolean;
}) {
  return (
    <article className={`rounded-xl border px-4 py-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
      <div className={`mb-3 flex size-10 items-center justify-center rounded-[8px] ${iconBg}`}>{icon}</div>
      <p className={`text-4xl font-bold tracking-tight [zoom:0.58] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{value}</p>
      <p className={`mt-1 text-base ${isDark ? "text-slate-400" : "text-[#667085]"}`}>{label}</p>
    </article>
  );
}

type AdminResultsReviewScreenProps = {
  initialThemeDark?: boolean;
};

export function AdminResultsReviewScreen({ initialThemeDark = false }: AdminResultsReviewScreenProps) {
  const { isDark, toggleTheme } = useAdminTheme(initialThemeDark);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReviewTab>("all");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<AdminReviewRow[]>([]);
  const [summary, setSummary] = useState({ pending: 0, reviewedToday: 0, passed: 0, failed: 0 });
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState("");
  const hasCachedOnMountRef = useRef(false);
  const initialFetchHandledRef = useRef(false);
  const pageSize = 8;

  const filteredRows = useMemo(() => rows, [rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPageSafe, filteredRows]);

  useEffect(() => {
    const cached = readCachedReviews();
    if (cached.rows.length > 0) {
      setRows(cached.rows);
      setSummary(cached.summary);
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

  const loadRows = useCallback(async () => {
    if (!token) return;
    try {
      const response = await listAdminReviews(token, { tab: activeTab, search: query });
      const nextRows = response.rows || [];
      const nextSummary = response.summary || { pending: 0, reviewedToday: 0, passed: 0, failed: 0 };
      setRows(nextRows);
      setSummary(nextSummary);
      writeCachedReviews(nextRows, nextSummary);
      setError("");
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Failed to load reviews";
      setError(message);
    }
  }, [activeTab, query, token]);

  useEffect(() => {
    if (!token) return;
    if (!initialFetchHandledRef.current) {
      initialFetchHandledRef.current = true;
      if (hasCachedOnMountRef.current) return;
    }
    void loadRows();
  }, [loadRows, token]);

  useEffect(() => {
    if (!token) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (document.visibilityState === "visible") {
          void loadRows();
        }
      }, REVIEWS_POLL_MS);
    };

    const stopPolling = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadRows();
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    if (document.visibilityState === "visible") {
      startPolling();
    }

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadRows, token]);

  return (
    <main className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-[#f8fafc]"}`}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar isDark={isDark} activeItem="results" />

        <section className="flex w-full flex-col">
          <AdminTopHeader
            isDark={isDark}
            onToggleTheme={toggleTheme}
            currentPage="Results & Review"
          />

          <div className="flex-1 space-y-8 px-6 pb-8 pt-7">
            <section>
              <h1 className={`text-[48px] font-bold tracking-[-0.72px] [zoom:0.58] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                Test Results & Review
              </h1>
              <p className={`text-base ${isDark ? "text-slate-300" : "text-[#667085]"}`}>
                {summary.pending} submissions pending coding review
              </p>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard value={String(summary.pending)} label="Pending Review" icon={<PendingIcon />} iconBg="bg-[#eef2ff]" isDark={isDark} />
              <SummaryCard value={String(summary.reviewedToday)} label="Reviewed Today" icon={<ReviewedIcon />} iconBg="bg-[#eff6ff]" isDark={isDark} />
              <SummaryCard value={String(summary.passed)} label="Passed" icon={<PassedIcon />} iconBg="bg-[#f0fdf4]" isDark={isDark} />
              <SummaryCard value={String(summary.failed)} label="Failed" icon={<FailedIcon />} iconBg="bg-[#fef2f2]" isDark={isDark} />
            </section>

            <section className={`rounded-[18px] border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div
                  className={`flex h-12 items-center gap-1 rounded-[10px] p-1 ${
                    isDark ? "bg-slate-800" : "bg-[#f1f5f9]"
                  }`}
                >
                  <AppSegmentedControl
                    options={[
                      { value: "pending", label: "Pending Review" },
                      { value: "all", label: "All Submissions" },
                      { value: "completed", label: "Completed" },
                    ]}
                    value={activeTab}
                    onChange={(value) => {
                      setActiveTab(value as ReviewTab);
                      setCurrentPage(1);
                    }}
                    className="h-full gap-1 bg-transparent p-0"
                    buttonClassName="h-11 px-5 text-[15px] font-medium"
                    activeButtonClassName={isDark ? "bg-slate-700 text-slate-100" : "bg-white text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"}
                    inactiveButtonClassName={isDark ? "text-slate-300 hover:bg-slate-700/60 hover:text-slate-100" : "text-[#334155] hover:bg-white/60 hover:text-[#0f172a]"}
                  />
                </div>

                <AppSearchBar
                  value={query}
                  onChange={(value) => {
                    setQuery(value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search Candidate"
                  isDark={isDark}
                  className="h-10 w-full max-w-[240px]"
                  inputClassName="text-sm"
                />
              </div>

              <div className="overflow-x-auto">
                {authError || error ? <p className="mb-3 text-sm text-red-600">{authError || error}</p> : null}
                <table className="w-full min-w-[1080px] border-separate border-spacing-y-2">
                  <thead>
                    <tr className={`${isDark ? "bg-slate-800 text-slate-300" : "bg-[#f3f4f6] text-[#475569]"}`}>
                      <th className="rounded-l-[8px] px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Candidate</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Test Info</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Submitted</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">MCQ Score</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Coding Status</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Status</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Violations</th>
                      <th className="rounded-r-[8px] px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, index) => (
                      <tr key={`${row.id}-${index}`}>
                        <td className={`px-4 py-2 text-center text-[18px] font-medium [zoom:0.84] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                          {row.candidate}
                        </td>
                        <td className={`px-4 py-2 text-center text-[18px] leading-6 [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>
                          {row.testInfo}
                        </td>
                        <td className={`px-4 py-2 text-center text-[16px] leading-5 [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#64748b]"}`}>
                          {row.submitted ? new Date(row.submitted).toLocaleString() : "-"}
                        </td>
                        <td className={`px-4 py-2 text-center text-[18px] [zoom:0.84] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                          {row.score}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span
                            className={`inline-flex min-w-[88px] items-center justify-center rounded-full border px-4 py-1 text-[16px] [zoom:0.84] ${
                              row.codingStatus === "Reviewed"
                                ? "border-[#22c55e] bg-[#f0fdf4] text-[#16a34a]"
                                : "border-[#cbd5e1] bg-[#f8fafc] text-[#475569]"
                            }`}
                          >
                            {row.codingStatus}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {(() => {
                            const statusValue = row.reviewStatus || "Pending";
                            return (
                              <span
                                className={`inline-flex min-w-[110px] items-center justify-center rounded-full border px-4 py-1 text-sm font-medium ${getReviewStatusBadge(
                                  statusValue as AdminReviewRow["reviewStatus"],
                                  isDark
                                )}`}
                              >
                                {statusValue}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {row.violations === 0 ? (
                            <span className={`text-[20px] [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#64748b]"}`}>-</span>
                          ) : (
                            <span className="inline-flex min-w-[88px] items-center justify-center rounded-[8px] border border-[#ef4444] bg-[#fef2f2] px-3 py-[2px] text-[16px] text-[#dc2626] [zoom:0.84]">
                              {`${row.violations} Detected`}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Link
                            href={`/admin/results-review/review?submissionId=${row.id}`}
                            className="inline-flex h-7 min-w-[90px] items-center justify-center gap-1 rounded-[8px] border border-[#3b82f6] bg-[#eff6ff] px-3 text-[16px] text-[#2563eb] [zoom:0.84]"
                          >
                            {row.action}
                            <ReviewArrow />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className={`text-[18px] [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>
                  Showing {paginatedRows.length} of {filteredRows.length} tests
                </p>
                <AppPagination
                  isDark={isDark}
                  currentPage={currentPageSafe}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </section>
          </div>

          <AdminFooter isDark={isDark} />
        </section>
      </div>
    </main>
  );
}

