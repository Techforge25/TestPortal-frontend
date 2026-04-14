"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminFooter } from "@/components/admin/components/AdminFooter";
import { AdminSelect } from "@/components/admin/components/AdminSelect";
import { AdminSidebar } from "@/components/admin/components/AdminSidebar";
import { AdminTopHeader } from "@/components/admin/components/AdminTopHeader";
import { useAdminTheme } from "@/components/admin/hooks/useAdminTheme";
import { getAdminToken } from "@/components/admin/lib/adminAuthStorage";
import { listAdminViolations, type AdminViolationRow } from "@/components/admin/lib/backendApi";
import { AppPagination } from "@/components/shared/ui/AppPagination";
import { AppSearchBar } from "@/components/shared/ui/AppSearchBar";
import { useRealtimeSubscription } from "@/components/shared/realtime/useRealtimeSubscription";

const VIOLATIONS_CACHE_KEY = "admin_violations_cache_v1";

function readCachedViolationRows(): AdminViolationRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(VIOLATIONS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { rows?: AdminViolationRow[] };
    return Array.isArray(parsed?.rows) ? parsed.rows : [];
  } catch {
    return [];
  }
}

function writeCachedViolationRows(rows: AdminViolationRow[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(VIOLATIONS_CACHE_KEY, JSON.stringify({ rows }));
  } catch {
    // Ignore cache write errors.
  }
}

type ViolationSeverity = "High" | "Medium" | "Low";

function getSeverityClasses(severity: ViolationSeverity) {
  if (severity === "High") {
    return "border-[#ef4444] bg-[#fff5f5] text-[#dc2626]";
  }

  if (severity === "Medium") {
    return "border-[#f59e0b] bg-[#fffbeb] text-[#b45309]";
  }

  return "border-[#22c55e] bg-[#f0fdf4] text-[#16a34a]";
}

type AdminViolationsLogScreenProps = {
  initialThemeDark?: boolean;
};

export function AdminViolationsLogScreen({ initialThemeDark = false }: AdminViolationsLogScreenProps) {
  const { isDark, toggleTheme } = useAdminTheme(initialThemeDark);
  const [token, setToken] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<AdminViolationRow[]>([]);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState("");
  const hasCachedOnMountRef = useRef(false);
  const initialFetchHandledRef = useRef(false);
  const pageSize = 8;

  const filteredRows = useMemo(() => {
    return rows;
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPageSafe, filteredRows]);

  useEffect(() => {
    const cached = readCachedViolationRows();
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
      const response = await listAdminViolations(token, {
        search: query,
        severity: severityFilter,
      });
      const nextRows = response.rows || [];
      setRows(nextRows);
      writeCachedViolationRows(nextRows);
      setError("");
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Failed to load violations";
      setError(message);
    }
  }, [query, severityFilter, token]);

  useEffect(() => {
    if (!token) return;
    if (!initialFetchHandledRef.current) {
      initialFetchHandledRef.current = true;
      if (hasCachedOnMountRef.current) return;
    }
    void loadRows();
  }, [loadRows, token]);

  useRealtimeSubscription({
    token,
    events: ["admin:violations.updated", "admin:data.changed"],
    onEvent: async () => {
      if (document.visibilityState === "visible") {
        await loadRows();
      }
    },
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (!token) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadRows();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [loadRows, token]);

  return (
    <main className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-[#f8fafc]"}`}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar isDark={isDark} activeItem="violations" />

        <section className="flex w-full flex-col">
          <AdminTopHeader
            isDark={isDark}
            onToggleTheme={toggleTheme}
            currentPage="Violations Log"
          />

          <div className="flex-1 space-y-5 px-6 pb-8 pt-5">
            <section>
              <h1 className={`text-[48px] font-semibold tracking-[-0.72px] [zoom:0.58] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                Violations Log
              </h1>
              <p className={`mt-1 text-base ${isDark ? "text-slate-300" : "text-[#667085]"}`}>
                {filteredRows.length} Total Violations Recorded
              </p>
            </section>

            <section className={`rounded-[8px] border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
              <div className="grid gap-3 md:grid-cols-[1fr_170px]">
                <AppSearchBar
                  value={query}
                  onChange={(value) => {
                    setQuery(value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search Tests..."
                  isDark={isDark}
                  className="h-[52px] px-4"
                  inputClassName="text-base"
                  showIcon={false}
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
                  className="h-[52px]"
                />
              </div>
            </section>

            <section className={`rounded-[24px] border p-6 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
              <div className="overflow-x-auto">
                {authError || error ? <p className="mb-3 text-sm text-red-600">{authError || error}</p> : null}
                <table className="w-full min-w-[1120px] border-separate border-spacing-x-2 border-spacing-y-5">
                  <thead>
                    <tr className={`${isDark ? "bg-slate-800 text-slate-300" : "bg-[#f9fafb] text-[#475569]"}`}>
                      <th className="rounded-l-[8px] px-5 py-5 text-center text-[18px] font-medium [zoom:0.84]">Candidate</th>
                      <th className="px-5 py-5 text-center text-[18px] font-medium [zoom:0.84]">Test</th>
                      <th className="px-5 py-5 text-center text-[18px] font-medium [zoom:0.84]">Violation Type</th>
                      <th className="px-5 py-5 text-center text-[18px] font-medium [zoom:0.84]">Timestamp</th>
                      <th className="px-5 py-5 text-center text-[18px] font-medium [zoom:0.84]">Severity</th>
                      <th className="rounded-r-[8px] px-5 py-5 text-center text-[18px] font-medium [zoom:0.84]">Action Taken</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => (
                      <tr key={row.id}>
                        <td className={`px-5 py-3 text-center text-[18px] font-medium leading-7 [zoom:0.84] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                          {row.candidate}
                        </td>
                        <td className={`px-5 py-3 text-center text-[18px] leading-7 [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>
                          {row.test}
                        </td>
                        <td className={`px-5 py-3 text-center text-[16px] [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>
                          {row.violationType}
                        </td>
                        <td className={`px-5 py-3 text-center text-[18px] leading-5 [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#64748b]"}`}>
                          {row.timestamp ? new Date(row.timestamp).toLocaleString() : "-"}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex h-[34px] min-w-[108px] items-center justify-center rounded-full border px-4 text-[16px] [zoom:0.84] ${getSeverityClasses((row.severity.charAt(0).toUpperCase() + row.severity.slice(1)) as ViolationSeverity)}`}>
                            {row.severity.charAt(0).toUpperCase() + row.severity.slice(1)}
                          </span>
                        </td>
                        <td className={`px-5 py-3 text-center text-[18px] leading-5 [zoom:0.84] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                          {row.actionTaken}
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
