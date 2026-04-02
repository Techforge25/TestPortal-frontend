"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminFooter } from "@/components/admin/components/AdminFooter";
import { AdminSelect } from "@/components/admin/components/AdminSelect";
import { AdminSidebar } from "@/components/admin/components/AdminSidebar";
import { AdminTopHeader } from "@/components/admin/components/AdminTopHeader";
import { useAdminTheme } from "@/components/admin/hooks/useAdminTheme";
import { getAdminToken } from "@/components/admin/lib/adminAuthStorage";
import { listAdminCandidates, type AdminCandidateRow } from "@/components/admin/lib/backendApi";
import { AppPagination } from "@/components/shared/ui/AppPagination";
import { AppSearchBar } from "@/components/shared/ui/AppSearchBar";

const CANDIDATES_POLL_MS = 30000;
const CANDIDATES_CACHE_KEY = "admin_candidates_cache_v1";

function readCachedCandidateRows(): AdminCandidateRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(CANDIDATES_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { rows?: AdminCandidateRow[] };
    return Array.isArray(parsed?.rows) ? parsed.rows : [];
  } catch {
    return [];
  }
}

function writeCachedCandidateRows(rows: AdminCandidateRow[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CANDIDATES_CACHE_KEY, JSON.stringify({ rows }));
  } catch {
    // Ignore cache write errors.
  }
}

type AdminCandidatesScreenProps = {
  initialThemeDark?: boolean;
};

export function AdminCandidatesScreen({ initialThemeDark = false }: AdminCandidatesScreenProps) {
  const { isDark, toggleTheme } = useAdminTheme(initialThemeDark);
  const [query, setQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<AdminCandidateRow[]>([]);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState("");
  const [token, setToken] = useState<string | null>(null);
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
    const cached = readCachedCandidateRows();
    if (cached.length > 0) {
      setRows(cached);
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
      const response = await listAdminCandidates(token, {
        search: query,
        position: positionFilter,
        severity: severityFilter,
      });
      const nextRows = response.rows || [];
      setRows(nextRows);
      writeCachedCandidateRows(nextRows);
      setError("");
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Failed to load candidates";
      setError(message);
    }
  }, [positionFilter, query, severityFilter, token]);

  useEffect(() => {
    if (!token) {
      return;
    }
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
      }, CANDIDATES_POLL_MS);
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
        <AdminSidebar isDark={isDark} activeItem="candidate" />

        <section className="flex w-full flex-col">
          <AdminTopHeader isDark={isDark} onToggleTheme={toggleTheme} currentPage="Candidates" />

          <div className="flex-1 space-y-5 px-6 pb-8 pt-5">
            <section>
              <h1 className={`text-[48px] font-semibold tracking-[-0.72px] [zoom:0.58] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                Candidates
              </h1>
              <p className={`mt-1 text-base ${isDark ? "text-slate-300" : "text-[#667085]"}`}>{filteredRows.length} Total Candidates</p>
            </section>

            <section className={`rounded-[8px] border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
              <div className="grid gap-3 md:grid-cols-[1fr_160px_160px]">
                <AppSearchBar
                  value={query}
                  onChange={(value) => {
                    setQuery(value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search Tests..."
                  isDark={isDark}
                  className="h-10 px-4"
                  inputClassName="text-base"
                  showIcon={false}
                />
                <AdminSelect
                  value={positionFilter}
                  onChange={(value) => {
                    setPositionFilter(value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "all", label: "All Positions" },
                    { value: "frontend", label: "Frontend" },
                    { value: "backend", label: "Backend" },
                    { value: "full stack", label: "Full Stack" },
                  ]}
                  isDark={isDark}
                  className="h-10"
                />
                <AdminSelect
                  value={severityFilter}
                  onChange={(value) => {
                    setSeverityFilter(value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "all", label: "All Severity" },
                    { value: "high", label: "High" },
                    { value: "medium", label: "Medium" },
                    { value: "low", label: "Low" },
                  ]}
                  isDark={isDark}
                  className="h-10"
                />
              </div>
            </section>

            <section className={`rounded-[18px] border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
              <div className="overflow-x-auto">
                {authError || error ? <p className="mb-3 text-sm text-red-600">{authError || error}</p> : null}
                <table className="w-full min-w-[1080px] border-separate border-spacing-y-3">
                  <thead>
                    <tr className={`${isDark ? "bg-slate-800 text-slate-300" : "bg-[#f3f4f6] text-[#475569]"}`}>
                      <th className="rounded-l-[8px] px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Candidate</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Position</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">MCQ Score</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Coding Status</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Violations</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Final Status</th>
                      <th className="rounded-r-[8px] px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => (
                      <tr key={row.id}>
                        <td className={`px-4 py-3 text-center text-[18px] font-medium [zoom:0.84] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{row.candidate}</td>
                        <td className={`px-4 py-3 text-center text-[18px] leading-7 [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>{row.position}</td>
                        <td className={`px-4 py-3 text-center text-[16px] [zoom:0.84] ${isDark ? "text-slate-200" : "text-[#0f172a]"}`}>{row.mcqScore}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex min-w-[90px] items-center justify-center rounded-full border border-[#22c55e] bg-[#f6fffa] px-4 py-1 text-[16px] text-[#16a34a] [zoom:0.84]">
                            {row.codingStatus}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-center text-[18px] [zoom:0.84] ${isDark ? "text-slate-200" : "text-[#475569]"}`}>{row.violations}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex min-w-[90px] items-center justify-center rounded-full border px-4 py-1 text-[16px] [zoom:0.84] ${
                              row.finalStatus === "Passed"
                                ? "border-[#22c55e] bg-[#f6fffa] text-[#16a34a]"
                                : row.finalStatus === "Failed"
                                  ? "border-[#ef4444] bg-[#fef2f2] text-[#dc2626]"
                                  : "border-[#3b82f6] bg-[#eff6ff] text-[#1d4ed8]"
                            }`}
                          >
                            {row.finalStatus}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-center text-[16px] leading-5 [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#64748b]"}`}>
                          {row.date ? new Date(row.date).toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="flex flex-wrap items-center justify-between gap-3">
              <p className={`text-[18px] [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>
                Showing {paginatedRows.length} of {filteredRows.length} tests
              </p>
              <AppPagination
                isDark={isDark}
                currentPage={currentPageSafe}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </section>
          </div>

          <AdminFooter isDark={isDark} />
        </section>
      </div>
    </main>
  );
}


