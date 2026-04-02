"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminFooter } from "@/components/admin/components/AdminFooter";
import { AdminSelect } from "@/components/admin/components/AdminSelect";
import { AdminSidebar } from "@/components/admin/components/AdminSidebar";
import { AdminTopHeader } from "@/components/admin/components/AdminTopHeader";
import { useAdminTheme } from "@/components/admin/hooks/useAdminTheme";
import { AppButton } from "@/components/shared/ui/AppButton";
import { AppPagination } from "@/components/shared/ui/AppPagination";
import { AppSearchBar } from "@/components/shared/ui/AppSearchBar";
import { deleteAdminTest, listAdminTests } from "@/components/admin/lib/backendApi";
import { getAdminToken } from "@/components/admin/lib/adminAuthStorage";
import { setEditingTestDraft, type AdminTestListItem } from "@/components/admin/lib/testListStorage";

function CreateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5">
      <path d="M12 4L20 12L12 20L4 12L12 4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8V16" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12H16" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 -960 960 960" className="size-5 fill-[#9CA3AF]">
      <path d="M602.83-377.17q50.5-50.5 50.5-122.83t-50.5-122.83q-50.5-50.5-122.83-50.5t-122.83 50.5q-50.5 50.5-50.5 122.83t50.5 122.83q50.5 50.5 122.83 50.5t122.83-50.5ZM401.5-421.5q-32.17-32.17-32.17-78.5t32.17-78.5q32.17-32.17 78.5-32.17t78.5 32.17q32.17 32.17 32.17 78.5t-32.17 78.5q-32.17 32.17-78.5 32.17t-78.5-32.17Zm-186.17 139Q96.67-365 40-500q56.67-135 175.33-217.5Q334-800 480-800t264.67 82.5Q863.33-635 920-500q-56.67 135-175.33 217.5Q626-200 480-200t-264.67-82.5ZM480-500Zm217.5 169.83q99.17-63.5 151.17-169.83-52-106.33-151.17-169.83-99.17-63.5-217.5-63.5t-217.5 63.5Q163.33-606.33 110.67-500q52.66 106.33 151.83 169.83 99.17 63.5 217.5 63.5t217.5-63.5Z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 -960 960 960" className="size-5 fill-[#94A3B8]">
      <path d="M200-200h57l399-399-57-57-399 399v57Zm-80 80v-170l527-527q12-12 27-18t30-6q15 0 30 6t27 18l56 56q12 12 18 27t6 30q0 15-6 30t-18 27L290-120H120Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 -960 960 960" className="size-5 fill-[#94A3B8]">
      <path d="M267-120q-27 0-47-20t-20-47v-553h-40v-67h192v-33h256v33h192v67h-40v553q0 27-20 47t-47 20H267Zm426-620H267v553h426v-553ZM365-271h67v-386h-67v386Zm163 0h67v-386h-67v386Z" />
    </svg>
  );
}

const TEST_LIST_POLL_MS = 30000;
const TEST_LIST_CACHE_KEY = "admin_test_list_cache_v1";

function readCachedTestRows(): AdminTestListItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(TEST_LIST_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { rows?: AdminTestListItem[] };
    return Array.isArray(parsed?.rows) ? parsed.rows : [];
  } catch {
    return [];
  }
}

function writeCachedTestRows(rows: AdminTestListItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(TEST_LIST_CACHE_KEY, JSON.stringify({ rows }));
  } catch {
    // Ignore cache write errors.
  }
}

const PasscodeExpiryCell = ({ row, isDark, nowMs }: { row: AdminTestListItem; isDark: boolean; nowMs: number }) => {
  let remainingSeconds: number | null = null;
  if (row.status === "Active" && row.passcodeExpiresAt) {
    const expiryMs = new Date(row.passcodeExpiresAt).getTime();
    if (!Number.isNaN(expiryMs)) {
      const remainingMs = Math.max(0, expiryMs - nowMs);
      remainingSeconds = Math.floor(remainingMs / 1000);
    }
  }

  const display =
    remainingSeconds === null
      ? "--"
      : `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  const colorClass =
    remainingSeconds !== null && remainingSeconds <= 60
      ? isDark
        ? "animate-pulse text-red-400"
        : "animate-pulse text-red-600"
      : remainingSeconds !== null && remainingSeconds <= 300
        ? isDark
          ? "text-amber-300"
          : "text-amber-600"
        : isDark
          ? "text-slate-200"
          : "text-[#0f172a]";

  return (
    <td className={`px-4 py-3 text-center text-[16px] font-semibold tabular-nums [zoom:0.84] ${colorClass}`}>
      {display}
    </td>
  );
};

type AdminTestListScreenProps = {
  initialThemeDark?: boolean;
};

export function AdminTestListScreen({ initialThemeDark = false }: AdminTestListScreenProps) {
  const router = useRouter();
  const { isDark, toggleTheme } = useAdminTheme(initialThemeDark);
  const token = getAdminToken();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<AdminTestListItem[]>([]);
  const [viewRow, setViewRow] = useState<AdminTestListItem | null>(null);
  const [deleteRow, setDeleteRow] = useState<AdminTestListItem | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const hasCachedOnMountRef = useRef(false);
  const initialFetchHandledRef = useRef(false);

  useEffect(() => {
    const cached = readCachedTestRows();
    if (cached.length > 0) {
      setRows(cached);
      setIsLoading(false);
      hasCachedOnMountRef.current = true;
    }

    const tick = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setNowMs(Date.now());
      }
    }, 1000);
    return () => window.clearInterval(tick);
  }, []);

  const loadRows = useCallback(
    async (showLoading = true) => {
      if (!token) return;
      if (showLoading) setIsLoading(true);
      setError("");
      try {
        const backendRows = await listAdminTests(token);
        setRows(backendRows);
        writeCachedTestRows(backendRows);
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to load tests";
        setError(message);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!initialFetchHandledRef.current) {
      initialFetchHandledRef.current = true;
      if (hasCachedOnMountRef.current) {
        // Use cached list immediately; network refresh will happen in poll/visibility.
      } else {
        void loadRows(true);
      }
    } else {
      void loadRows(false);
    }
    let timer: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (document.visibilityState === "visible") {
          void loadRows(false);
        }
      }, TEST_LIST_POLL_MS);
    };

    const stopPolling = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadRows(false);
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
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesQuery =
        row.testName.toLowerCase().includes(query.toLowerCase()) ||
        row.position.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : row.status.toLowerCase() === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, rows, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPageSafe, filteredRows]);

  async function confirmDeleteRow() {
    if (!deleteRow) return;
    if (token) {
      try {
        await deleteAdminTest(token, deleteRow.id);
      } catch (deleteError) {
        const message = deleteError instanceof Error ? deleteError.message : "Failed to delete test";
        setError(message);
        return;
      }
    }
    setRows((prev) => prev.filter((row) => row.id !== deleteRow.id));
    setDeleteRow(null);
  }

  return (
    <main className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-[#f8fafc]"}`}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar isDark={isDark} activeItem="list" />

        <section className="flex w-full flex-col">
          <AdminTopHeader isDark={isDark} onToggleTheme={toggleTheme} currentPage="Test List" />

          <div className="flex-1 space-y-5 px-6 pb-8 pt-5">
            <section className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className={`text-[48px] font-semibold tracking-[-0.72px] [zoom:0.58] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                  Test List
                </h1>
                <p className={`mt-1 text-base ${isDark ? "text-slate-300" : "text-[#667085]"}`}>
                  {filteredRows.length} Tests Created
                </p>
              </div>
              <AppButton
                variant="primary"
                size="md"
                leftIcon={<CreateIcon />}
                className="min-w-[148px]"
                onClick={() => router.push("/admin/create-test")}
              >
                Crate Test
              </AppButton>
            </section>

            <section className={`rounded-[8px] border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
              <div className="grid gap-3 md:grid-cols-[1fr_130px]">
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
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "active", label: "Active" },
                    { value: "draft", label: "Draft" },
                  ]}
                  isDark={isDark}
                  className="h-10"
                />
              </div>
            </section>

            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : null}

            <section className={`rounded-[18px] border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] border-separate border-spacing-y-3">
                  <thead>
                    <tr className={`${isDark ? "bg-slate-800 text-slate-300" : "bg-[#f3f4f6] text-[#475569]"}`}>
                      <th className="rounded-l-[8px] px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Test Name</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Position</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Duration</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">MCQs</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Coding</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Passcode</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Passcode Expires</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Status</th>
                      <th className="px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Created</th>
                      <th className="rounded-r-[8px] px-4 py-3 text-center text-[18px] font-medium [zoom:0.84]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => (
                      <tr key={row.id}>
                        <td className={`px-4 py-3 text-center text-[18px] font-medium leading-7 [zoom:0.84] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                          {row.testName}
                        </td>
                        <td className={`px-4 py-3 text-center text-[18px] leading-7 [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>
                          {row.position}
                        </td>
                        <td className={`px-4 py-3 text-center text-[16px] [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>
                          {row.duration} min
                        </td>
                        <td className={`px-4 py-3 text-center text-[18px] [zoom:0.84] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                          {row.mcqs}
                        </td>
                        <td className={`px-4 py-3 text-center text-[18px] [zoom:0.84] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                          {row.coding}
                        </td>
                        <td className={`px-4 py-3 text-center text-[16px] font-medium tracking-[0.06em] [zoom:0.84] ${isDark ? "text-slate-200" : "text-[#1f3a8a]"}`}>
                          {row.passcode}
                        </td>
                        <PasscodeExpiryCell row={row} isDark={isDark} nowMs={nowMs} />
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex min-w-[76px] items-center justify-center rounded-full border px-4 py-1 text-[16px] [zoom:0.84] ${
                            row.status === "Active"
                              ? "border-[#16a34a] bg-[#f8fafc] text-[#16a34a]"
                              : "border-[#f59e0b] bg-[#fffbeb] text-[#b45309]"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-center text-[16px] [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#64748b]"}`}>
                          {row.created}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center justify-center gap-2.5">
                            <button type="button" aria-label="View test" onClick={() => setViewRow(row)}><EyeIcon /></button>
                            <button
                              type="button"
                              aria-label="Edit test"
                              onClick={() => {
                                setEditingTestDraft(row);
                                router.push("/admin/create-test");
                              }}
                            >
                              <EditIcon />
                            </button>
                            <button type="button" aria-label="Delete test" onClick={() => setDeleteRow(row)}><TrashIcon /></button>
                          </div>
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

          {viewRow ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/55 px-4">
              <div className={`w-full max-w-[520px] rounded-[14px] border p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)] ${
                isDark ? "border-slate-700 bg-slate-900" : "border-[#dbe3ef] bg-white"
              }`}>
                <h3 className={`text-[30px] font-semibold tracking-[-0.45px] [zoom:0.58] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Test Details</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className={`rounded-[10px] border p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-[#e2e8f0] bg-[#f8fafc]"}`}>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>Test Name</p>
                    <p className={`mt-1 text-[15px] font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{viewRow.testName}</p>
                  </div>
                  <div className={`rounded-[10px] border p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-[#e2e8f0] bg-[#f8fafc]"}`}>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>Position</p>
                    <p className={`mt-1 text-[15px] font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{viewRow.position}</p>
                  </div>
                  <div className={`rounded-[10px] border p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-[#e2e8f0] bg-[#f8fafc]"}`}>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>Duration</p>
                    <p className={`mt-1 text-[15px] font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{viewRow.duration} min</p>
                  </div>
                  <div className={`rounded-[10px] border p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-[#e2e8f0] bg-[#f8fafc]"}`}>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>Passcode</p>
                    <p className="mt-1 font-mono text-[15px] font-semibold tracking-[0.08em] text-[#1f3a8a]">{viewRow.passcode}</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <AppButton variant="primary" onClick={() => setViewRow(null)}>Close</AppButton>
                </div>
              </div>
            </div>
          ) : null}

          {deleteRow ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/55 px-4">
              <div className={`w-full max-w-[460px] rounded-[14px] border p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)] ${
                isDark ? "border-slate-700 bg-slate-900" : "border-[#dbe3ef] bg-white"
              }`}>
                <h3 className={`text-[30px] font-semibold tracking-[-0.45px] [zoom:0.58] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Delete Test?</h3>
                <p className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-[#64748b]"}`}>
                  Are you sure you want to delete <span className={`font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{deleteRow.testName}</span>?
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <AppButton variant="ghost" onClick={() => setDeleteRow(null)}>Cancel</AppButton>
                  <AppButton variant="danger" onClick={confirmDeleteRow}>Delete</AppButton>
                </div>
              </div>
            </div>
          ) : null}

          <AdminFooter isDark={isDark} />
        </section>
      </div>
    </main>
  );
}

