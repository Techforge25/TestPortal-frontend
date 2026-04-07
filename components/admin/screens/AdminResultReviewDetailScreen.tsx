"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AdminFooter } from "@/components/admin/components/AdminFooter";
import { AdminSidebar } from "@/components/admin/components/AdminSidebar";
import { AdminTopHeader } from "@/components/admin/components/AdminTopHeader";
import { useAdminTheme } from "@/components/admin/hooks/useAdminTheme";
import { getAdminToken } from "@/components/admin/lib/adminAuthStorage";
import {
  getAdminReviewDetail,
  saveAdminReviewDecision,
  type AdminReviewDetailResponse,
} from "@/components/admin/lib/backendApi";
import { AppButton } from "@/components/shared/ui/AppButton";
import { AppSegmentedControl } from "@/components/shared/ui/AppSegmentedControl";

type Decision = "Passed" | "Failed" | "Shortlisted" | "On Hold";
type ReviewTab = "overview" | "mcq" | "assessment" | "coding" | "violations";
type CodingReviewStatus = "Under Review" | "Passed" | "Failed" | "On Hold";

type CodingReviewDraft = {
  taskIndex: number;
  title: string;
  maxMarks: number;
  marksAwarded: number;
  status: CodingReviewStatus;
  feedback: string;
};

type SectionReviewDraft = {
  sectionKey: "short_answer" | "long_answer" | "scenario" | "ui_preview" | "portfolio_link" | "bug_report" | "test_case";
  itemIndex: number;
  title: string;
  maxMarks: number;
  marksAwarded: number;
  status: CodingReviewStatus;
  feedback: string;
};

type AdminResultReviewDetailScreenProps = {
  submissionId: string;
  initialThemeDark?: boolean;
};

function BackArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5">
      <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScoreIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6" style={{ color }}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 12L11 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6 text-[#d97706]">
      <circle cx="12" cy="13" r="7.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 13V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 13L14.8 14.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.5 3.5H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5 text-[#f59e0b]">
      <path d="M12 4L20 19H4L12 4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 9.5V13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  );
}

type ParsedUiPreviewAnswer = {
  framework: "html_css_js" | "react_tailwind";
  html: string;
  css: string;
  js: string;
  reactCode: string;
};

function parseUiPreviewAnswer(raw: string): ParsedUiPreviewAnswer | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ParsedUiPreviewAnswer>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      framework: parsed.framework === "html_css_js" ? "html_css_js" : "react_tailwind",
      html: String(parsed.html || ""),
      css: String(parsed.css || ""),
      js: String(parsed.js || ""),
      reactCode: String(parsed.reactCode || ""),
    };
  } catch {
    return null;
  }
}

function buildUiPreviewDoc(answer: ParsedUiPreviewAnswer) {
  if (answer.framework === "react_tailwind") {
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>html,body{margin:0;padding:0} ${answer.css || ""}</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    function TaskApp() {
      ${answer.reactCode || 'return <div className="p-6">No UI code submitted.</div>;'}
    }
    ReactDOM.createRoot(document.getElementById("root")).render(<TaskApp />);
  </script>
</body>
</html>`;
  }

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>html,body{margin:0;padding:0} ${answer.css || ""}</style>
</head>
<body>
  ${answer.html || "<div>No UI code submitted.</div>"}
  <script>${String(answer.js || "").replace(/<\/(script)/gi, "<\\/$1")}</script>
</body>
</html>`;
}

function parseUiPreviewPrompt(raw: string): string {
  if (!raw?.trim()) return "";
  try {
    const parsed = JSON.parse(raw) as { taskPrompt?: string };
    return String(parsed.taskPrompt || "");
  } catch {
    return raw;
  }
}

function ScoreCard({
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
    <article className={`rounded-[12px] border px-3 py-6 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
      <div className={`mb-2 flex size-[50px] items-center justify-center rounded-[8px] ${iconBg}`}>{icon}</div>
      <p className={`text-4xl font-bold tracking-tight [zoom:0.58] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{value}</p>
      <p className={`mt-1 text-base ${isDark ? "text-slate-400" : "text-[#666c77]"}`}>{label}</p>
    </article>
  );
}

export function AdminResultReviewDetailScreen({ submissionId, initialThemeDark = false }: AdminResultReviewDetailScreenProps) {
  const { isDark, toggleTheme } = useAdminTheme(initialThemeDark);
  const token = getAdminToken();
  const [activeTab, setActiveTab] = useState<ReviewTab>("overview");
  const resolvedSubmissionId = submissionId;
  const [detail, setDetail] = useState<AdminReviewDetailResponse["submission"] | null>(null);
  const [decision, setDecision] = useState<Decision>("On Hold");
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(token && submissionId));
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isProfileViewOpen, setIsProfileViewOpen] = useState(false);
  const [codingReviews, setCodingReviews] = useState<CodingReviewDraft[]>([]);
  const [sectionReviews, setSectionReviews] = useState<SectionReviewDraft[]>([]);

  const authError = token ? "" : "Admin session missing. Please login again.";
  const submissionError = resolvedSubmissionId ? "" : "No submission found.";

  const decisions: Decision[] = ["Passed", "Failed", "Shortlisted", "On Hold"];
  const hasAssessmentRows = Boolean(detail?.sectionRows?.length);
  const hasCodingRows = Boolean(detail?.codingRows?.length);
  const tabs: { id: ReviewTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "mcq", label: "MCQ Answers" },
    ...(hasAssessmentRows ? [{ id: "assessment" as const, label: "Assessment Answers" }] : []),
    ...(hasCodingRows ? [{ id: "coding" as const, label: "Coding Submissions" }] : []),
    { id: "violations", label: "Violations Log" },
  ];

  useEffect(() => {
    if (tabs.some((tab) => tab.id === activeTab)) return;
    setActiveTab("overview");
  }, [activeTab, tabs]);

  const profileRows = useMemo(
    () =>
      detail
        ? [
            { label: "Email", value: detail.candidateEmail },
            { label: "Phone", value: detail.candidateProfile.phoneNumber },
            { label: "CNIC", value: detail.candidateProfile.cnic },
            { label: "Marital Status", value: detail.candidateProfile.maritalStatus },
            { label: "Qualification", value: detail.candidateProfile.qualification },
            { label: "Date of Birth", value: detail.candidateProfile.dateOfBirth },
            { label: "Position Applied", value: detail.candidateProfile.positionAppliedFor },
            { label: "Address", value: detail.candidateProfile.residentialAddress },
            { label: "Experience", value: detail.candidateProfile.workExperience },
            { label: "Start Date", value: detail.candidateProfile.startDate },
            { label: "End Date", value: detail.candidateProfile.endDate },
            { label: "Current Salary", value: detail.candidateProfile.currentSalary },
            { label: "Expected Salary", value: detail.candidateProfile.expectedSalary },
            { label: "Expected Joining Date", value: detail.candidateProfile.expectedJoiningDate },
            { label: "Shift Comfortable", value: detail.candidateProfile.shiftComfortable },
          ].filter((row) => row.value && row.value.trim().length > 0)
        : [],
    [detail]
  );

  const loadSubmissionDetail = useCallback(
    async (targetSubmissionId: string) => {
      if (!token || !targetSubmissionId) return;
      const response = await getAdminReviewDetail(token, targetSubmissionId);
      setDetail(response.submission);
      setCodingReviews(
        (response.submission.codingRows || []).map((task) => ({
          taskIndex: task.taskIndex,
          title: task.title,
          maxMarks: task.maxMarks,
          marksAwarded: task.marksAwarded || 0,
          status: task.status || "Under Review",
          feedback: task.feedback || "",
        }))
      );
      setSectionReviews(
        (response.submission.sectionRows || []).map((row) => ({
          sectionKey: row.sectionKey,
          itemIndex: row.itemIndex,
          title: row.title,
          maxMarks: row.maxMarks,
          marksAwarded: row.marksAwarded || 0,
          status: row.status || "Under Review",
          feedback: row.feedback || "",
        }))
      );
      if (response.submission.review?.decision) {
        setDecision(response.submission.review.decision);
      }
      setComment(response.submission.review?.comment || "");
      setError("");
    },
    [token]
  );

  useEffect(() => {
    if (!token || !resolvedSubmissionId) return;
    const run = async () => {
      try {
        await loadSubmissionDetail(resolvedSubmissionId);
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : "Failed to load candidate review";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [resolvedSubmissionId, loadSubmissionDetail, token]);

  function escapeHtml(value: string) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function handleDownloadProfilePdf() {
    if (!detail) return;
    const popup = window.open("", "_blank", "width=1000,height=900");
    if (!popup) return;

    const field = (label: string, value: string) => `
      <div class="field">
        <div class="label">${escapeHtml(label)}</div>
        <div class="value">${escapeHtml(value || "-")}</div>
      </div>
    `;

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Candidate Registration - ${escapeHtml(detail.candidateName || "Candidate")}</title>
          <style>
            * { box-sizing: border-box; font-family: Arial, sans-serif; }
            body { margin: 0; padding: 24px; background: #f1f5f9; color: #0f172a; }
            .wrap { max-width: 960px; margin: 0 auto; }
            .brand {
              background: #1f3a8a;
              border-radius: 12px;
              padding: 10px 14px;
              text-align: center;
              margin-bottom: 16px;
            }
            .brand img {
              height: 52px;
              width: auto;
              max-width: 100%;
              object-fit: contain;
              display: inline-block;
            }
            .card {
              background: white;
              border: 1px solid #d6dbe6;
              border-radius: 14px;
              padding: 22px 20px;
            }
            .title {
              text-align: center;
              font-size: 30px;
              font-weight: 700;
              margin: 2px 0 6px;
              letter-spacing: 0.2px;
            }
            .subtitle { text-align: center; color: #667085; font-size: 13px; margin-bottom: 20px; }
            .section { margin-top: 16px; }
            .section:first-of-type { margin-top: 0; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
            .grid-1 { display: grid; grid-template-columns: 1fr; gap: 14px; }
            .field .label { font-size: 13px; font-weight: 600; margin-bottom: 7px; color: #0f172a; }
            .field .value {
              min-height: 44px;
              border: 1px solid #d6dbe6;
              border-radius: 10px;
              padding: 12px 13px;
              font-size: 14px;
              line-height: 1.35;
              background: #f8fafc;
              color: #0f172a;
            }
            .divider { height: 1px; background: #e2e8f0; margin: 12px 0 4px; }
            .meta {
              margin-top: 18px;
              padding-top: 14px;
              border-top: 1px solid #e2e8f0;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px 14px;
            }
            .meta .item {
              font-size: 13px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 9px;
              padding: 10px 12px;
            }
            .meta .item b { color: #334155; display: inline-block; min-width: 100px; }
            @media print {
              body { background: white; padding: 10px; }
              .wrap { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="brand">
              <img src="${window.location.origin}/assest/images/40.png" alt="Techforge logo" />
            </div>
            <div class="card">
              <div class="title">Candidate Registration</div>
              <div class="subtitle">Enter Your Details To Begin The Assessment</div>

              <div class="section grid-1">
                ${field("Full Name", detail.candidateName || "")}
              </div>

              <div class="section grid-2">
                ${field("Email Address", detail.candidateEmail || "")}
                ${field("Phone Number", detail.candidateProfile.phoneNumber || "")}
                ${field("Cnic Num", detail.candidateProfile.cnic || "")}
                ${field("Marital Status", detail.candidateProfile.maritalStatus || "")}
                ${field("Qualification", detail.candidateProfile.qualification || "")}
                ${field("Date of Birth", detail.candidateProfile.dateOfBirth || "")}
              </div>

              <div class="section grid-1">
                ${field("Position Applied For", detail.candidateProfile.positionAppliedFor || "")}
                ${field("Residential Address", detail.candidateProfile.residentialAddress || "")}
                ${field("Work Experience", detail.candidateProfile.workExperience || "")}
              </div>

              <div class="section grid-2">
                ${field("Start Date", detail.candidateProfile.startDate || "")}
                ${field("End Date", detail.candidateProfile.endDate || "")}
              </div>
              <div class="divider"></div>

              <div class="section grid-2">
                ${field("Current Salary", detail.candidateProfile.currentSalary || "")}
                ${field("Expected Salary", detail.candidateProfile.expectedSalary || "")}
                ${field("Expected Date of Joining", detail.candidateProfile.expectedJoiningDate || "")}
                ${field("Comfortable with 9 AM-6 PM shift?", detail.candidateProfile.shiftComfortable || "")}
              </div>

              <div class="meta">
                <div class="item"><b>Test:</b> ${escapeHtml(detail.test?.title || "-")}</div>
                <div class="item"><b>Position:</b> ${escapeHtml(detail.test?.position || "-")}</div>
                <div class="item"><b>Submitted At:</b> ${escapeHtml(detail.submittedAt ? new Date(detail.submittedAt).toLocaleString() : "-")}</div>
                <div class="item"><b>Final Decision:</b> ${escapeHtml(detail.review?.decision || "Pending")}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  async function handleSaveDecision() {
    if (!token || !resolvedSubmissionId) return;
    setIsSaving(true);
    setSaveMessage("");
    try {
      const response = await saveAdminReviewDecision(token, resolvedSubmissionId, {
        decision,
        comment,
        codingReviews: codingReviews.map((row) => ({
          taskIndex: row.taskIndex,
          marksAwarded: row.marksAwarded,
          status: row.status,
          feedback: row.feedback,
        })),
        sectionReviews: sectionReviews.map((row) => ({
          sectionKey: row.sectionKey,
          itemIndex: row.itemIndex,
          marksAwarded: row.marksAwarded,
          status: row.status,
          feedback: row.feedback,
        })),
      });
      setSaveMessage(response.message || "Review decision saved");
      await loadSubmissionDetail(resolvedSubmissionId);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save decision";
      setSaveMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-[#f8fafc]"}`}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar isDark={isDark} activeItem="results" />

        <section className="flex w-full flex-col">
          <AdminTopHeader isDark={isDark} onToggleTheme={toggleTheme} currentPage="Results & Review" />

          <div className="flex-1 space-y-5 px-6 pb-8 pt-6">
            <Link href="/admin/results-review" className={`inline-flex items-center gap-1 text-base ${isDark ? "text-slate-300" : "text-[#475569]"}`}>
              <BackArrowIcon />
              Back To Results & Review
            </Link>

            <section className={`rounded-[8px] border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
              <div className="flex items-center gap-3">
                <h1 className={`text-[48px] font-semibold tracking-[-0.72px] [zoom:0.58] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                  {detail?.candidateName || "Candidate"}
                </h1>
                <span className="inline-flex h-7 items-center rounded-full border border-[#22c55e] bg-[#f8fafc] px-4 text-[16px] text-[#16a34a] [zoom:0.84]">
                  {detail?.review?.decision || detail?.status || "In Review"}
                </span>
              </div>
              <p className={`mt-1 text-[18px] [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>
                {detail?.test ? `${detail.test.position} | ${detail.test.title}` : "No test linked"}
              </p>
              <p className={`mt-1 text-[16px] [zoom:0.84] ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>
                Test Date: {detail?.submittedAt ? new Date(detail.submittedAt).toLocaleDateString() : "-"}
              </p>
            </section>

            <section className={`rounded-[8px] border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className={`text-[20px] font-semibold [zoom:0.84] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Candidate Profile</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProfileViewOpen(true)}
                    disabled={!detail}
                    className={`inline-flex h-[38px] items-center rounded-[8px] px-4 text-[15px] [zoom:0.84] ${isDark ? "bg-slate-800 text-slate-100" : "bg-[#0f172a] text-white"}`}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadProfilePdf}
                    disabled={!detail}
                    className={`inline-flex h-[38px] items-center rounded-[8px] px-4 text-[15px] [zoom:0.84] ${isDark ? "bg-slate-800 text-slate-100" : "bg-[#1f3a8a] text-white"}`}
                  >
                    Download PDF
                  </button>
                </div>
              </div>

              {isLoading ? (
                <p className={`${isDark ? "text-slate-300" : "text-[#475569]"}`}>Loading candidate profile...</p>
              ) : authError || submissionError || error ? (
                <p className="text-red-600">{authError || submissionError || error}</p>
              ) : profileRows.length === 0 ? (
                <p className={`${isDark ? "text-slate-300" : "text-[#475569]"}`}>No profile data available yet.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {profileRows.map((row) => (
                    <div key={row.label} className={`rounded-[8px] border px-3 py-2 ${isDark ? "border-slate-700 bg-slate-800" : "border-[#e2e8f0] bg-[#f8fafc]"}`}>
                      <p className={`text-[13px] uppercase tracking-wide ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>{row.label}</p>
                      <p className={`mt-1 text-[16px] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{row.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={`rounded-[8px] border-b pb-3 ${isDark ? "border-slate-700" : "border-[#e2e8f0]"}`}>
              <div className={`inline-flex h-14 items-center gap-3 rounded-[8px] p-[6px] ${isDark ? "bg-slate-800" : "bg-[#f3f4f6]"}`}>
                <AppSegmentedControl
                  options={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
                  value={activeTab}
                  onChange={(value) => setActiveTab(value as ReviewTab)}
                  className="h-full gap-3 bg-transparent p-0"
                  buttonClassName="h-11 px-6 text-[18px] [zoom:0.84]"
                  activeButtonClassName={isDark ? "bg-slate-700 text-slate-100" : "bg-white text-[#0f172a]"}
                  inactiveButtonClassName={isDark ? "text-slate-300 hover:bg-slate-700/40" : "text-[#0f172a] hover:bg-white/60"}
                />
              </div>
            </section>

            {activeTab === "overview" ? (
              <>
                <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <ScoreCard value={`${detail?.overview.mcqScorePercent || 0}%`} label="MCQ Score" icon={<ScoreIcon color="#4f46e5" />} iconBg="bg-[#eef2ff]" isDark={isDark} />
                  <ScoreCard value={`${detail?.overview.codingScorePercent || 0}%`} label="Coding Score" icon={<ScoreIcon color="#2563eb" />} iconBg="bg-[#eff6ff]" isDark={isDark} />
                  <ScoreCard value={`${detail?.overview.totalScorePercent || 0}%`} label="Total Score" icon={<ScoreIcon color="#16a34a" />} iconBg="bg-[#f0fdf4]" isDark={isDark} />
                  <ScoreCard value={detail?.overview.timeTaken || "-"} label="Time Taken" icon={<TimerIcon />} iconBg="bg-[#fffbeb]" isDark={isDark} />
                </section>

                <section className={`rounded-[8px] border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
                  <div className="flex items-center gap-2">
                    <WarningIcon />
                    <h2 className={`text-[18px] font-medium [zoom:0.84] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Violations</h2>
                  </div>
                  <p className={`mt-2 text-[42px] font-medium tracking-[-0.63px] [zoom:0.58] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                    {detail?.overview.violations || 0}
                  </p>
                </section>

                <section>
                  <h3 className={`text-[36px] font-semibold tracking-[-0.54px] [zoom:0.58] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Final Decision</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    {decisions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setDecision(item)}
                        className={`h-[42px] rounded-[8px] px-6 text-[18px] [zoom:0.84] transition ${
                          decision === item
                            ? item === "Passed"
                              ? "bg-[#16a34a] text-white"
                              : "bg-[#1f3a8a] text-white"
                            : isDark
                              ? "bg-slate-800 text-slate-200"
                              : "bg-[#f3f4f6] text-[#0f172a]"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className={`text-[18px] font-medium [zoom:0.84] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Comments</h4>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Add any notes or comments..."
                    className={`h-[164px] w-full rounded-[8px] border p-3 text-[18px] tracking-[-0.27px] [zoom:0.84] outline-none ${
                      isDark
                        ? "border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-400"
                        : "border-[#e2e8f0] bg-white text-[#0f172a] placeholder:text-[#9ca3af]"
                    }`}
                  />
                  <div className="mt-3 flex items-center justify-end gap-3">
                    {saveMessage ? (
                      <p className={`text-sm ${saveMessage.toLowerCase().includes("failed") ? "text-red-600" : "text-emerald-600"}`}>
                        {saveMessage}
                      </p>
                    ) : null}
                    <AppButton variant="primary" onClick={handleSaveDecision} disabled={isSaving || !detail}>
                      {isSaving ? "Saving..." : "Save Decision"}
                    </AppButton>
                  </div>
                </section>
              </>
            ) : null}

            {activeTab === "mcq" ? (
              <section className={`rounded-[24px] border px-6 py-8 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
                <div className={`grid grid-cols-[0.5fr_3fr_1fr_1fr_0.6fr] rounded-[8px] px-5 py-5 text-[18px] [zoom:0.84] ${isDark ? "bg-slate-800 text-slate-300" : "bg-[#f9fafb] text-[#475569]"}`}>
                  <p className="text-center">Q#</p>
                  <p>Question</p>
                  <p className="text-center">Selected</p>
                  <p className="text-center">Correct</p>
                  <p className="text-center">Marks</p>
                </div>
                <div className="space-y-6 pt-5">
                  {(detail?.mcqRows || []).map((row) => (
                    <div key={row.q} className="grid grid-cols-[0.5fr_3fr_1fr_1fr_0.6fr] items-center px-5 py-1 text-[18px] [zoom:0.84]">
                      <p className={`text-center font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{row.q}</p>
                      <p className={`leading-7 ${isDark ? "text-slate-300" : "text-[#475569]"}`}>{row.question}</p>
                      <p className={`text-center ${row.wrong ? "text-[#dc2626]" : "text-[#16a34a]"}`}>{row.selected}</p>
                      <p className="text-center text-[#16a34a]">{row.correct}</p>
                      <p className="text-center text-[#16a34a]">{row.marks}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {activeTab === "coding" ? (
              <section className="space-y-6">
                {(detail?.codingRows || []).map((task) => (
                  <article key={task.title} className={`rounded-[8px] border ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
                    <div className={`flex items-center justify-between rounded-t-[8px] px-4 py-2 ${isDark ? "bg-slate-800" : "bg-[#f3f4f6]"}`}>
                      <div className="flex items-center gap-2">
                        <h4 className={`text-[20px] font-semibold [zoom:0.84] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{task.title}</h4>
                        <span className={`rounded-full border px-2 py-[2px] text-[14px] [zoom:0.84] ${isDark ? "border-slate-600 text-slate-300" : "border-[#d1d5db] text-[#4b5563]"}`}>
                          {task.language}
                        </span>
                      </div>
                      <p className={`text-[14px] [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#64748b]"}`}>Max: {task.maxMarks} marks</p>
                    </div>
                    <div className="grid gap-4 p-4 xl:grid-cols-[1.2fr_0.8fr]">
                      <pre className="overflow-x-auto rounded-[12px] bg-[#0f2258] p-4 text-[13px] leading-6 text-white">{task.code || "// No code submitted"}</pre>
                      <div className="space-y-4">
                        {(() => {
                          const review = codingReviews.find((item) => item.taskIndex === task.taskIndex);
                          if (!review) return null;
                          return (
                            <>
                              <div className={`grid gap-3 rounded-[8px] border p-3 sm:grid-cols-2 ${isDark ? "border-slate-700 bg-slate-800" : "border-[#e2e8f0] bg-white"}`}>
                                <div>
                                  <p className={`text-[14px] ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>Marks Awarded</p>
                                  <input
                                    type="number"
                                    min={0}
                                    max={task.maxMarks}
                                    value={review.marksAwarded}
                                    onChange={(event) => {
                                      const next = Number(event.target.value || 0);
                                      const clamped = Number.isFinite(next) ? Math.max(0, Math.min(task.maxMarks, next)) : 0;
                                      setCodingReviews((prev) =>
                                        prev.map((item) =>
                                          item.taskIndex === task.taskIndex ? { ...item, marksAwarded: clamped } : item
                                        )
                                      );
                                    }}
                                    className={`mt-1 h-11 w-full rounded-[8px] border px-3 text-[16px] outline-none ${
                                      isDark
                                        ? "border-slate-600 bg-slate-900 text-slate-100"
                                        : "border-[#d6dbe6] bg-white text-[#0f172a]"
                                    }`}
                                  />
                                  <p className={`mt-1 text-[12px] ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>Max {task.maxMarks}</p>
                                </div>
                                <div>
                                  <p className={`text-[14px] ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>Status</p>
                                  <select
                                    value={review.status}
                                    onChange={(event) =>
                                      setCodingReviews((prev) =>
                                        prev.map((item) =>
                                          item.taskIndex === task.taskIndex
                                            ? { ...item, status: event.target.value as CodingReviewStatus }
                                            : item
                                        )
                                      )
                                    }
                                    className={`mt-1 h-11 w-full rounded-[8px] border px-3 text-[16px] outline-none ${
                                      isDark
                                        ? "border-slate-600 bg-slate-900 text-slate-100"
                                        : "border-[#d6dbe6] bg-white text-[#0f172a]"
                                    }`}
                                  >
                                    <option value="Under Review">Under Review</option>
                                    <option value="Passed">Passed</option>
                                    <option value="Failed">Failed</option>
                                    <option value="On Hold">On Hold</option>
                                  </select>
                                </div>
                              </div>
                              <div className={`rounded-[8px] border p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-[#e2e8f0] bg-white"}`}>
                                <p className={`text-[14px] ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>Feedback</p>
                                <textarea
                                  value={review.feedback}
                                  onChange={(event) =>
                                    setCodingReviews((prev) =>
                                      prev.map((item) =>
                                        item.taskIndex === task.taskIndex ? { ...item, feedback: event.target.value } : item
                                      )
                                    )
                                  }
                                  placeholder="Write feedback for this coding task..."
                                  className={`mt-1 h-28 w-full rounded-[8px] border p-3 text-[15px] leading-6 outline-none ${
                                    isDark
                                      ? "border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-400"
                                      : "border-[#d6dbe6] bg-white text-[#111827] placeholder:text-[#94a3b8]"
                                  }`}
                                />
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </article>
                ))}
                <div className="flex justify-end">
                  <AppButton variant="primary" onClick={handleSaveDecision} disabled={isSaving || !detail}>
                    {isSaving ? "Saving..." : "Save Coding Review"}
                  </AppButton>
                </div>
              </section>
            ) : null}

            {activeTab === "assessment" ? (
              <section className="space-y-4">
                {(detail?.sectionRows || []).map((row) => {
                  const review = sectionReviews.find(
                    (item) => item.sectionKey === row.sectionKey && item.itemIndex === row.itemIndex
                  );
                  const parsedUiAnswer = row.sectionKey === "ui_preview" ? parseUiPreviewAnswer(row.answer || "") : null;
                  return (
                    <article
                      key={`${row.sectionKey}-${row.itemIndex}`}
                      className={`rounded-[8px] border ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}
                    >
                      <div className={`rounded-t-[8px] px-4 py-2 ${isDark ? "bg-slate-800" : "bg-[#f3f4f6]"}`}>
                        <div className="flex items-center justify-between gap-3">
                          <h4 className={`text-[18px] font-semibold [zoom:0.84] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                            {row.title}
                          </h4>
                          <p className={`text-[13px] [zoom:0.84] ${isDark ? "text-slate-300" : "text-[#64748b]"}`}>
                            Max: {row.maxMarks} marks
                          </p>
                        </div>
                        {row.prompt ? (
                          <p className={`mt-1 text-sm ${isDark ? "text-slate-300" : "text-[#475569]"}`}>
                            {row.sectionKey === "ui_preview" ? parseUiPreviewPrompt(row.prompt) : row.prompt}
                          </p>
                        ) : null}
                      </div>

                      <div className="grid gap-4 p-4 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className={`rounded-[10px] border p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-[#e2e8f0] bg-[#f8fafc]"}`}>
                          <p className={`mb-2 text-[14px] ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>Candidate Answer</p>
                          {parsedUiAnswer ? (
                            <div className="space-y-3">
                              <p className={`text-[13px] font-medium ${isDark ? "text-slate-300" : "text-[#334155]"}`}>
                                Framework: {parsedUiAnswer.framework === "react_tailwind" ? "React + Tailwind" : "HTML/CSS/JS"}
                              </p>
                              <iframe
                                title={`ui-preview-${row.itemIndex}`}
                                sandbox="allow-scripts"
                                srcDoc={buildUiPreviewDoc(parsedUiAnswer)}
                                className={`h-[280px] w-full rounded-[8px] border ${isDark ? "border-slate-600" : "border-[#dbe3ef]"} bg-white`}
                              />
                              {parsedUiAnswer.framework === "react_tailwind" ? (
                                <pre className={`overflow-x-auto rounded-[8px] p-3 text-[12px] leading-5 ${isDark ? "bg-slate-900 text-slate-100" : "bg-[#0f172a] text-white"}`}>
                                  {parsedUiAnswer.reactCode || "// No React code"}
                                </pre>
                              ) : (
                                <div className="space-y-2">
                                  <pre className={`overflow-x-auto rounded-[8px] p-3 text-[12px] leading-5 ${isDark ? "bg-slate-900 text-slate-100" : "bg-[#0f172a] text-white"}`}>
                                    {parsedUiAnswer.html || "<!-- No HTML -->"}
                                  </pre>
                                  <pre className={`overflow-x-auto rounded-[8px] p-3 text-[12px] leading-5 ${isDark ? "bg-slate-900 text-slate-100" : "bg-[#0f172a] text-white"}`}>
                                    {parsedUiAnswer.css || "/* No CSS */"}
                                  </pre>
                                  <pre className={`overflow-x-auto rounded-[8px] p-3 text-[12px] leading-5 ${isDark ? "bg-slate-900 text-slate-100" : "bg-[#0f172a] text-white"}`}>
                                    {parsedUiAnswer.js || "// No JS"}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ) : (
                            <pre className={`whitespace-pre-wrap text-[14px] leading-6 ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                              {row.answer || "-"}
                            </pre>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div className={`grid gap-3 rounded-[8px] border p-3 sm:grid-cols-2 ${isDark ? "border-slate-700 bg-slate-800" : "border-[#e2e8f0] bg-white"}`}>
                            <div>
                              <p className={`text-[14px] ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>Marks Awarded</p>
                              <input
                                type="number"
                                min={0}
                                max={row.maxMarks}
                                value={review?.marksAwarded ?? 0}
                                onChange={(event) => {
                                  const next = Number(event.target.value || 0);
                                  const clamped = Number.isFinite(next) ? Math.max(0, Math.min(row.maxMarks, next)) : 0;
                                  setSectionReviews((prev) =>
                                    prev.map((item) =>
                                      item.sectionKey === row.sectionKey && item.itemIndex === row.itemIndex
                                        ? { ...item, marksAwarded: clamped }
                                        : item
                                    )
                                  );
                                }}
                                className={`mt-1 h-11 w-full rounded-[8px] border px-3 text-[16px] outline-none ${
                                  isDark ? "border-slate-600 bg-slate-900 text-slate-100" : "border-[#d6dbe6] bg-white text-[#0f172a]"
                                }`}
                              />
                            </div>
                            <div>
                              <p className={`text-[14px] ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>Status</p>
                              <select
                                value={review?.status || "Under Review"}
                                onChange={(event) =>
                                  setSectionReviews((prev) =>
                                    prev.map((item) =>
                                      item.sectionKey === row.sectionKey && item.itemIndex === row.itemIndex
                                        ? { ...item, status: event.target.value as CodingReviewStatus }
                                        : item
                                    )
                                  )
                                }
                                className={`mt-1 h-11 w-full rounded-[8px] border px-3 text-[16px] outline-none ${
                                  isDark ? "border-slate-600 bg-slate-900 text-slate-100" : "border-[#d6dbe6] bg-white text-[#0f172a]"
                                }`}
                              >
                                <option value="Under Review">Under Review</option>
                                <option value="Passed">Passed</option>
                                <option value="Failed">Failed</option>
                                <option value="On Hold">On Hold</option>
                              </select>
                            </div>
                          </div>
                          <div className={`rounded-[8px] border p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-[#e2e8f0] bg-white"}`}>
                            <p className={`text-[14px] ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>Feedback</p>
                            <textarea
                              value={review?.feedback || ""}
                              onChange={(event) =>
                                setSectionReviews((prev) =>
                                  prev.map((item) =>
                                    item.sectionKey === row.sectionKey && item.itemIndex === row.itemIndex
                                      ? { ...item, feedback: event.target.value }
                                      : item
                                  )
                                )
                              }
                              placeholder="Write feedback..."
                              className={`mt-1 h-24 w-full rounded-[8px] border p-3 text-[15px] leading-6 outline-none ${
                                isDark ? "border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-400" : "border-[#d6dbe6] bg-white text-[#111827] placeholder:text-[#94a3b8]"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
                <div className="flex justify-end">
                  <AppButton variant="primary" onClick={handleSaveDecision} disabled={isSaving || !detail}>
                    {isSaving ? "Saving..." : "Save Assessment Review"}
                  </AppButton>
                </div>
              </section>
            ) : null}

            {activeTab === "violations" ? (
              <section className={`rounded-[24px] border px-6 py-8 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
                <h3 className={`mb-4 text-[26px] font-medium tracking-[-0.39px] [zoom:0.84] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                  Violations ({detail?.violationRows?.length || 0})
                </h3>
                {!detail?.violationRows?.length ? (
                  <p className={`${isDark ? "text-slate-300" : "text-[#475569]"}`}>No violations found for this submission.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px] border-separate border-spacing-y-2">
                      <thead>
                        <tr className={`${isDark ? "bg-slate-800 text-slate-300" : "bg-[#f3f4f6] text-[#475569]"}`}>
                          <th className="rounded-l-[8px] px-4 py-3 text-left text-sm font-medium">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Severity</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                          <th className="rounded-r-[8px] px-4 py-3 text-left text-sm font-medium">Occurred At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.violationRows.map((row) => (
                          <tr key={row.id}>
                            <td className={`px-4 py-2 text-sm ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{row.type}</td>
                            <td className={`px-4 py-2 text-sm ${isDark ? "text-slate-300" : "text-[#475569]"}`}>
                              {row.severity.charAt(0).toUpperCase() + row.severity.slice(1)}
                            </td>
                            <td className={`px-4 py-2 text-sm ${isDark ? "text-slate-300" : "text-[#475569]"}`}>{row.actionTaken}</td>
                            <td className={`px-4 py-2 text-sm ${isDark ? "text-slate-300" : "text-[#475569]"}`}>
                              {row.occurredAt ? new Date(row.occurredAt).toLocaleString() : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ) : null}
          </div>

          <AdminFooter isDark={isDark} />
        </section>
      </div>

      {isProfileViewOpen && detail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
          <div className={`max-h-[90vh] w-full max-w-[920px] overflow-y-auto rounded-[14px] border p-5 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#dbe3ef] bg-white"}`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className={`text-[24px] font-semibold ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Candidate Registration</h3>
                <p className={`${isDark ? "text-slate-300" : "text-[#667085]"}`}>Enter Your Details To Begin The Assessment</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileViewOpen(false)}
                className={`rounded-[8px] px-3 py-1 text-sm ${isDark ? "bg-slate-800 text-slate-100" : "bg-[#f1f5f9] text-[#0f172a]"}`}
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className={`mb-2 text-sm font-medium ${isDark ? "text-slate-200" : "text-[#0f172a]"}`}>Full Name</p>
                <div className={`rounded-[10px] border px-4 py-3 ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-[#e3e7ee] bg-[#f8fafc] text-[#0f172a]"}`}>{detail.candidateName || "-"}</div>
              </div>

              {[
                ["Email Address", detail.candidateEmail],
                ["Phone Number", detail.candidateProfile.phoneNumber],
                ["Cnic Num", detail.candidateProfile.cnic],
                ["Marital Status", detail.candidateProfile.maritalStatus],
                ["Qualification", detail.candidateProfile.qualification],
                ["Date of Birth", detail.candidateProfile.dateOfBirth],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className={`mb-2 text-sm font-medium ${isDark ? "text-slate-200" : "text-[#0f172a]"}`}>{label}</p>
                  <div className={`rounded-[10px] border px-4 py-3 ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-[#e3e7ee] bg-[#f8fafc] text-[#0f172a]"}`}>{value || "-"}</div>
                </div>
              ))}

              {[
                ["Position Applied For", detail.candidateProfile.positionAppliedFor],
                ["Residential Address", detail.candidateProfile.residentialAddress],
                ["Work Experience", detail.candidateProfile.workExperience],
              ].map(([label, value]) => (
                <div key={label} className="md:col-span-2">
                  <p className={`mb-2 text-sm font-medium ${isDark ? "text-slate-200" : "text-[#0f172a]"}`}>{label}</p>
                  <div className={`rounded-[10px] border px-4 py-3 ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-[#e3e7ee] bg-[#f8fafc] text-[#0f172a]"}`}>{value || "-"}</div>
                </div>
              ))}

              {[
                ["Start Date", detail.candidateProfile.startDate],
                ["End Date", detail.candidateProfile.endDate],
                ["Current Salary", detail.candidateProfile.currentSalary],
                ["Expected Salary", detail.candidateProfile.expectedSalary],
                ["Expected Date of Joining", detail.candidateProfile.expectedJoiningDate],
                ["Comfortable with 9 AM-6 PM shift?", detail.candidateProfile.shiftComfortable],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className={`mb-2 text-sm font-medium ${isDark ? "text-slate-200" : "text-[#0f172a]"}`}>{label}</p>
                  <div className={`rounded-[10px] border px-4 py-3 ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-[#e3e7ee] bg-[#f8fafc] text-[#0f172a]"}`}>{value || "-"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
