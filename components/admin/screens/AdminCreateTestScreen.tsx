"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminFooter } from "@/components/admin/components/AdminFooter";
import { AdminSidebar } from "@/components/admin/components/AdminSidebar";
import { AdminTopHeader } from "@/components/admin/components/AdminTopHeader";
import { useAdminTheme } from "@/components/admin/hooks/useAdminTheme";
import { AppButton } from "@/components/shared/ui/AppButton";
import { AppDropdown } from "@/components/shared/ui/AppDropdown";
import { AppSegmentedControl } from "@/components/shared/ui/AppSegmentedControl";
import { CreateTestActionButtons } from "@/components/admin/components/create-test/CreateTestActionButtons";
import { CreateTestCard } from "@/components/admin/components/create-test/CreateTestCard";
import { CreateTestField } from "@/components/admin/components/create-test/CreateTestField";
import { CreateTestSummaryField } from "@/components/admin/components/create-test/CreateTestSummaryField";
import { CreateTestStepper, type CreateTestStep } from "@/components/admin/components/create-test/CreateTestStepper";
import { CreateTestToggle } from "@/components/admin/components/create-test/CreateTestToggle";
import { getAdminToken } from "@/components/admin/lib/adminAuthStorage";
import { getAdminSecurityDefaults, saveAdminTest } from "@/components/admin/lib/backendApi";
import {
  clearEditingTestDraft,
  readEditingTestDraft,
  savePublishedTest,
  type AdminTestListItem,
} from "@/components/admin/lib/testListStorage";

type McqQuestion = {
  id: number;
  prompt: string;
  options: string[];
  selectedIndex: number;
  marks: string;
};

type CodingTask = {
  id: number;
  title: string;
  taskName: string;
  language: string;
  description: string;
  marks: string;
  testCases: Array<{
    id: number;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    weight: string;
  }>;
};

type BasicInfoErrors = {
  testName?: string;
  position?: string;
  totalDuration?: string;
  passPercentage?: string;
  totalMcqs?: string;
  totalCodingTasks?: string;
};

function DiamondIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5">
      <path d="M12 4L20 12L12 20L4 12L12 4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8V16" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12H16" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 -960 960 960" className="size-6 fill-[#9CA3AF]">
      <path d="M267.33-120q-27.5 0-47.08-19.58-19.58-19.59-19.58-47.09V-740H160v-66.67h192V-840h256v33.33h192V-740h-40.67v553.33q0 27-19.83 46.84Q719.67-120 692.67-120H267.33Zm425.34-620H267.33v553.33h425.34V-740Zm-328 469.33h66.66v-386h-66.66v386Zm164 0h66.66v-386h-66.66v386ZM267.33-740v553.33V-740Z" />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="size-7 fill-[#1f3a8a]" aria-hidden="true">
      <path d="M226.67-80q-27.5 0-47.09-19.58Q160-119.17 160-146.67v-422.66q0-27.5 19.58-47.09Q199.17-636 226.67-636h60v-90.67q0-80.23 56.57-136.78T480.07-920q80.26 0 136.76 56.55 56.5 56.55 56.5 136.78V-636h60q27.5 0 47.09 19.58Q800-596.83 800-569.33v422.66q0 27.5-19.58 47.09Q760.83-80 733.33-80H226.67Zm0-66.67h506.66v-422.66H226.67v422.66Zm308.5-155.85Q558-325.04 558-356.67q0-31-22.95-55.16Q512.11-436 479.89-436t-55.06 24.17Q402-387.67 402-356.33q0 31.33 22.95 53.83 22.94 22.5 55.16 22.5t55.06-22.52ZM353.33-636h253.34v-90.67q0-52.77-36.92-89.72-36.93-36.94-89.67-36.94-52.75 0-89.75 36.94-37 36.95-37 89.72V-636ZM226.67-146.67v-422.66 422.66Z" />
    </svg>
  );
}

function ReviewPublishIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="size-7 fill-[#1f3a8a]" aria-hidden="true">
      <path d="m200-553.67 96.67 41Q313.33-546 332-578q18.67-32 40-62l-71.33-14.33L200-553.67ZM350-472l126.67 126.33q52-22.66 101.33-55.66T662-469q77.33-77.33 115.83-162.5T816.67-812q-95.34.33-180.67 38.83-85.33 38.5-162.67 115.84-34.66 34.66-67.66 84Q372.67-524 350-472Zm191-137.5q0-30.83 21-51.83t52-21q31 0 52 21t21 51.83q0 30.83-21 51.83t-52 21q-31 0-52-21t-21-51.83Zm17.33 414.17L659-296l-14.33-71.33q-30 21.33-62 39.83t-65.34 35.17l41 97ZM880-875.67q12.33 131-30.5 243.84Q806.67-519 706-418.33q-.67.66-1.33 1.33-.67.67-1.34 1.33l21.34 106.34Q728-292.67 723-277q-5 15.67-17 27.67L536-78.67l-84.67-197.66L281-446.67 83.33-531.33l170.34-170q12-12 27.83-17 15.83-5 32.5-1.67l106.33 21.33q.67-.66 1.34-1 .66-.33 1.33-1 100.67-100.66 213.33-144Q749-888 880-875.67Zm-728.33 552q35-35 85.5-35.5t85.5 34.5q35 35 34.5 85.5t-35.5 85.5q-25.67 25.67-81.5 43-55.84 17.34-162.84 32Q92-185.67 109-241.83q17-56.17 42.67-81.84Zm47 47.34Q186-263 175.33-232.83q-10.66 30.16-17.33 72.5 42.33-6.67 72.5-17.17 30.17-10.5 43.5-23.17 16.67-15.33 17.33-38Q292-261.33 276-278q-16.67-16-39.33-15.5-22.67.5-38 17.17Z" />
    </svg>
  );
}

function PublishButtonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="size-5 fill-white" aria-hidden="true">
      <path d="m200-553.67 96.67 41Q313.33-546 332-578q18.67-32 40-62l-71.33-14.33L200-553.67ZM350-472l126.67 126.33q52-22.66 101.33-55.66T662-469q77.33-77.33 115.83-162.5T816.67-812q-95.34.33-180.67 38.83-85.33 38.5-162.67 115.84-34.66 34.66-67.66 84Q372.67-524 350-472Zm191-137.5q0-30.83 21-51.83t52-21q31 0 52 21t21 51.83q0 30.83-21 51.83t-52 21q-31 0-52-21t-21-51.83Zm17.33 414.17L659-296l-14.33-71.33q-30 21.33-62 39.83t-65.34 35.17l41 97ZM880-875.67q12.33 131-30.5 243.84Q806.67-519 706-418.33q-.67.66-1.33 1.33-.67.67-1.34 1.33l21.34 106.34Q728-292.67 723-277q-5 15.67-17 27.67L536-78.67l-84.67-197.66L281-446.67 83.33-531.33l170.34-170q12-12 27.83-17 15.83-5 32.5-1.67l106.33 21.33q.67-.66 1.34-1 .66-.33 1.33-1 100.67-100.66 213.33-144Q749-888 880-875.67Zm-728.33 552q35-35 85.5-35.5t85.5 34.5q35 35 34.5 85.5t-35.5 85.5q-25.67 25.67-81.5 43-55.84 17.34-162.84 32Q92-185.67 109-241.83q17-56.17 42.67-81.84Zm47 47.34Q186-263 175.33-232.83q-10.66 30.16-17.33 72.5 42.33-6.67 72.5-17.17 30.17-10.5 43.5-23.17 16.67-15.33 17.33-38Q292-261.33 276-278q-16.67-16-39.33-15.5-22.67.5-38 17.17Z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 -960 960 960" className="size-5 fill-current">
      <path d="M360-240q-33 0-56.5-23.5T280-320v-440q0-33 23.5-56.5T360-840h360q33 0 56.5 23.5T800-760v440q0 33-23.5 56.5T720-240H360Zm0-80h360v-440H360v440ZM200-120q-33 0-56.5-23.5T120-200v-480h80v480h400v80H200Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5">
      <path d="M5 12.5L9.5 17L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const languageOptions = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "Go",
  "PHP",
  "Ruby",
] as const;

const roleOptions = [
  { value: "developer", label: "Developer" },
  { value: "designer", label: "Designer" },
  { value: "video_editor", label: "Video Editor" },
  { value: "qa_manual", label: "QA Manual" },
  { value: "hr", label: "HR" },
  { value: "sales", label: "Sales" },
  { value: "other", label: "Other" },
] as const;

const sectionOptions = [
  { key: "mcq", label: "MCQs" },
  { key: "coding", label: "Coding" },
  { key: "short_answer", label: "Short Answer" },
  { key: "long_answer", label: "Long Answer" },
  { key: "scenario", label: "Scenario" },
  { key: "portfolio_link", label: "Portfoilio / Assigement" },
  { key: "bug_report", label: "Bug Report" },
  { key: "test_case", label: "Test Case" },
] as const;

type RoleCategory = (typeof roleOptions)[number]["value"];
type SectionKey = (typeof sectionOptions)[number]["key"];
type NonCodingSectionKey = Exclude<SectionKey, "mcq" | "coding">;

type SectionPromptItem = {
  id: number;
  value: string;
};

const rolePresetSections: Record<RoleCategory, string[]> = {
  developer: ["mcq", "coding"],
  designer: ["mcq", "scenario", "portfolio_link", "short_answer"],
  video_editor: ["mcq", "scenario", "short_answer", "long_answer"],
  qa_manual: ["mcq", "bug_report", "test_case", "short_answer"],
  hr: ["mcq", "scenario", "long_answer"],
  sales: ["mcq", "scenario", "long_answer"],
  other: ["mcq"],
};

const nonCodingSectionKeys: NonCodingSectionKey[] = [
  "scenario",
  "portfolio_link",
  "short_answer",
  "long_answer",
  "bug_report",
  "test_case",
];

const sectionDefaultPrompt: Record<NonCodingSectionKey, string> = {
  scenario: "Write a real-world scenario question for the candidate.",
  portfolio_link: "Paste portfolio/link prompt (e.g., Behance, Dribbble, GitHub, drive link).",
  short_answer: "Write a short answer question.",
  long_answer: "Write a long answer question.",
  bug_report: "Write a bug report analysis question.",
  test_case: "Write a test case design question.",
};

const ADMIN_SECURITY_LOCAL_KEY = "admin_security_defaults_local_v1";

type LocalSecurityDefaults = {
  forceFullscreen: boolean;
  disableTabSwitch: boolean;
  autoEndOnTabChange: boolean;
  disableCopyPaste: boolean;
  disableRightClick: boolean;
  detectDevTools: boolean;
  warningLimit: number;
  autoSaveInterval: number;
};

function readLocalSecurityDefaults(): LocalSecurityDefaults | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_SECURITY_LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalSecurityDefaults;
  } catch {
    return null;
  }
}

function QuestionBlock({
  title,
  prompt,
  options,
  selectedIndex,
  marks = "1",
  onPromptChange,
  onDelete,
  onSelectOption,
  onOptionChange,
  isDark,
}: {
  title: string;
  prompt: string;
  options: string[];
  selectedIndex: number;
  marks?: string;
  onPromptChange: (value: string) => void;
  onDelete: () => void;
  onSelectOption: (index: number) => void;
  onOptionChange: (index: number, value: string) => void;
  isDark: boolean;
}) {
  return (
    <article className={`rounded-[10px] border p-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0]"}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className={`rounded-[8px] border px-3 py-1 text-[30px] font-semibold [zoom:0.5] ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#3254a3] bg-[#f3f4f6] text-[#1f3a8a]"}`}>
          {title}
        </span>
        <button type="button" onClick={onDelete} aria-label={`Delete ${title}`}>
          <TrashIcon />
        </button>
      </div>
      <textarea
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        className={`h-[75px] w-full resize-none rounded-[8px] border px-3 py-3 text-[16px] outline-none placeholder:text-[#98a2b3] ${isDark ? "border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400" : "border-[#dbe3ef] bg-white text-[#0f172a]"}`}
        placeholder="Write your question..."
      />
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {options.map((option, index) => (
          <button
            key={`${title}-option-${index}`}
            type="button"
            onClick={() => onSelectOption(index)}
            className={`flex h-[52px] items-center gap-3 rounded-[8px] border px-3 text-left ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef]"}`}
          >
            <span className={`relative size-5 rounded-full border ${index === selectedIndex ? "border-[#3855a8]" : "border-[#98a2b3]"}`}>
              {index === selectedIndex ? <span className="absolute inset-[3px] rounded-full bg-[#1f3a8a]" /> : null}
            </span>
            <input
              value={option}
              onChange={(event) => onOptionChange(index, event.target.value)}
              onClick={(event) => event.stopPropagation()}
              className={`w-full bg-transparent text-[16px] outline-none ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}
            />
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={`text-[30px] [zoom:0.5] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>Marks :</span>
        <input defaultValue={marks} className={`h-7 w-[62px] rounded-[8px] border px-2 ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] text-[#0f172a]"}`} />
      </div>
    </article>
  );
}

function CodingTaskBlock({
  title,
  taskName,
  description,
  marks,
  testCases,
  language,
  onTaskNameChange,
  onDescriptionChange,
  onMarksChange,
  onTestCaseInputChange,
  onTestCaseOutputChange,
  onTestCaseWeightChange,
  onToggleTestCaseHidden,
  onAddTestCase,
  onDeleteTestCase,
  onLanguageChange,
  onDelete,
  isDark,
}: {
  title: string;
  taskName: string;
  description: string;
  marks: string;
  testCases: Array<{
    id: number;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    weight: string;
  }>;
  language: string;
  onTaskNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onMarksChange: (value: string) => void;
  onTestCaseInputChange: (caseId: number, value: string) => void;
  onTestCaseOutputChange: (caseId: number, value: string) => void;
  onTestCaseWeightChange: (caseId: number, value: string) => void;
  onToggleTestCaseHidden: (caseId: number) => void;
  onAddTestCase: () => void;
  onDeleteTestCase: (caseId: number) => void;
  onLanguageChange: (value: string) => void;
  onDelete: () => void;
  isDark: boolean;
}) {
  return (
    <article className={`rounded-[10px] border p-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0]"}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className={`rounded-[8px] border px-3 py-1 text-[30px] font-semibold [zoom:0.5] ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#3254a3] bg-[#f3f4f6] text-[#1f3a8a]"}`}>
          {title}
        </span>
        <button type="button" onClick={onDelete} aria-label={`Delete ${title}`}>
          <TrashIcon />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={taskName}
          onChange={(event) => onTaskNameChange(event.target.value)}
          className={`h-[52px] w-full rounded-[8px] border px-3 text-[16px] outline-none placeholder:text-[#98a2b3] ${isDark ? "border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400" : "border-[#dbe3ef] text-[#0f172a]"}`}
        />
        <AppDropdown
          value={language}
          onChange={onLanguageChange}
          options={languageOptions.map((option) => ({ value: option, label: option }))}
          ariaLabel={`${title} language`}
          className={`h-[52px] rounded-[8px] border ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef]"}`}
          triggerClassName={`px-3 text-[16px] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}
          chevronClassName={isDark ? "text-slate-400" : "text-[#98a2b3]"}
          menuClassName={`rounded-[10px] border shadow-lg ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef] bg-white"}`}
          optionClassName={`px-3 py-2 text-[15px] ${isDark ? "text-slate-200 hover:bg-slate-700" : "text-[#475569] hover:bg-[#f4f7ff]"}`}
          selectedOptionClassName="bg-[#e9efff] text-[#1f3a8a]"
        />
      </div>
      <div className="mt-3">
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          className={`h-[86px] w-full resize-none rounded-[8px] border px-3 py-3 text-[16px] outline-none placeholder:text-[#98a2b3] ${isDark ? "border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400" : "border-[#dbe3ef] text-[#0f172a]"}`}
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={`text-[30px] [zoom:0.5] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>Marks:</span>
        <input
          type="number"
          min="0"
          value={marks}
          onChange={(event) => onMarksChange(event.target.value.replace(/[^0-9]/g, ""))}
          className={`h-9 w-[96px] rounded-[8px] border px-2 outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] text-[#0f172a]"}`}
        />
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className={`text-[34px] font-medium tracking-[-0.51px] [zoom:0.5] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Test Cases</p>
          <AppButton size="sm" variant="secondary" onClick={onAddTestCase} className="h-9 px-3">
            Add Case
          </AppButton>
        </div>
        <div className="space-y-3">
          {testCases.map((testCase, idx) => (
            <div key={`${title}-case-${testCase.id}`} className={`rounded-[8px] border p-3 ${isDark ? "border-slate-700 bg-slate-800/40" : "border-[#dbe3ef] bg-[#f8fafc]"}`}>
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-300" : "text-[#475569]"}`}>{`Case ${idx + 1}`}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleTestCaseHidden(testCase.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      testCase.isHidden
                        ? "bg-[#fee2e2] text-[#991b1b]"
                        : "bg-[#dcfce7] text-[#166534]"
                    }`}
                  >
                    {testCase.isHidden ? "Hidden" : "Public"}
                  </button>
                  <button type="button" onClick={() => onDeleteTestCase(testCase.id)} className="text-xs text-[#ef4444]">
                    Remove
                  </button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px]">
                <input
                  value={testCase.input}
                  onChange={(event) => onTestCaseInputChange(testCase.id, event.target.value)}
                  placeholder="Input"
                  className={`h-[48px] w-full rounded-[8px] border px-3 text-[15px] outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] text-[#0f172a]"}`}
                />
                <input
                  value={testCase.expectedOutput}
                  onChange={(event) => onTestCaseOutputChange(testCase.id, event.target.value)}
                  placeholder="Expected Output"
                  className={`h-[48px] w-full rounded-[8px] border px-3 text-[15px] outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] text-[#0f172a]"}`}
                />
                <input
                  value={testCase.weight}
                  onChange={(event) => onTestCaseWeightChange(testCase.id, event.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Weight"
                  className={`h-[48px] w-full rounded-[8px] border px-3 text-[15px] outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] text-[#0f172a]"}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function getNextStep(step: CreateTestStep): CreateTestStep {
  return step === 5 ? 5 : ((step + 1) as CreateTestStep);
}

function getPreviousStep(step: CreateTestStep): CreateTestStep {
  return step === 1 ? 1 : ((step - 1) as CreateTestStep);
}

function getSectionLabel(sectionKey: string) {
  return sectionOptions.find((section) => section.key === sectionKey)?.label || sectionKey;
}

type AdminCreateTestScreenProps = {
  initialThemeDark?: boolean;
};

export function AdminCreateTestScreen({ initialThemeDark = false }: AdminCreateTestScreenProps) {
  const router = useRouter();
  const token = getAdminToken();
  const [initialDraft] = useState<AdminTestListItem | null>(() => {
    const draft = readEditingTestDraft();
    if (draft) clearEditingTestDraft();
    return draft;
  });
  const { isDark, toggleTheme } = useAdminTheme(initialThemeDark);
  const [step, setStep] = useState<CreateTestStep>(1);
  const [testName, setTestName] = useState(initialDraft?.testName ?? "");
  const [position, setPosition] = useState(initialDraft?.position ?? "");
  const [roleCategory, setRoleCategory] = useState<RoleCategory>((initialDraft?.roleCategory as RoleCategory) || "developer");
  const [enabledSections, setEnabledSections] = useState<string[]>(
    initialDraft?.enabledSections && initialDraft.enabledSections.length > 0
      ? initialDraft.enabledSections
      : rolePresetSections[(initialDraft?.roleCategory as RoleCategory) || "developer"]
  );
  const [totalDuration, setTotalDuration] = useState(initialDraft ? String(initialDraft.duration) : "");
  const [passPercentage, setPassPercentage] = useState(
    initialDraft && Number.isFinite(initialDraft.passPercentage)
      ? String(initialDraft.passPercentage)
      : ""
  );
  const [totalMcqs, setTotalMcqs] = useState(initialDraft ? String(initialDraft.mcqs) : "");
  const [totalCodingTasks, setTotalCodingTasks] = useState(initialDraft ? String(initialDraft.coding) : "");
  const [warningLimit, setWarningLimit] = useState("2");
  const [autoSaveInterval, setAutoSaveInterval] = useState("60");
  const [publishStatus, setPublishStatus] = useState<"draft" | "active">(initialDraft?.status === "Draft" ? "draft" : "active");
  const [editingTestMeta, setEditingTestMeta] = useState<{ id: number | string; passcode: string } | null>(
    initialDraft ? { id: initialDraft.id, passcode: initialDraft.passcode } : null
  );
  const [publishedTest, setPublishedTest] = useState<AdminTestListItem | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [basicInfoErrors, setBasicInfoErrors] = useState<BasicInfoErrors>({});
  const [securitySettings, setSecuritySettings] = useState({
    forceFullscreen: initialDraft?.securityFlags?.forceFullscreen ?? true,
    disableTabSwitch: initialDraft?.securityFlags?.disableTabSwitch ?? true,
    autoEndOnTabChange: initialDraft?.securityFlags?.autoEndOnTabChange ?? false,
    disableCopyPaste: initialDraft?.securityFlags?.disableCopyPaste ?? true,
    disableRightClick: initialDraft?.securityFlags?.disableRightClick ?? true,
    devToolsDetection: initialDraft?.securityFlags?.devToolsDetection ?? true,
  });
  const codingSectionEnabled = enabledSections.includes("coding");

  useEffect(() => {
    if (!initialDraft) return;
    if (typeof initialDraft.warningLimit === "number" && Number.isFinite(initialDraft.warningLimit)) {
      setWarningLimit(String(initialDraft.warningLimit));
    }
    if (
      typeof initialDraft.autoSaveIntervalSeconds === "number" &&
      Number.isFinite(initialDraft.autoSaveIntervalSeconds)
    ) {
      setAutoSaveInterval(String(initialDraft.autoSaveIntervalSeconds));
    }
  }, [initialDraft]);
  const [mcqQuestions, setMcqQuestions] = useState<McqQuestion[]>(
    initialDraft
      ? (
          Array.isArray(initialDraft.mcqQuestionsDetailed) && initialDraft.mcqQuestionsDetailed.length > 0
            ? initialDraft.mcqQuestionsDetailed
            : (initialDraft.mcqQuestionItems.length > 0 ? initialDraft.mcqQuestionItems : ["Question 1"]).map((prompt) => ({
                prompt,
                options: ["Option A", "Option B", "Option C", "Option D"],
                selectedIndex: 0,
                marks: 1,
              }))
        ).map((question, index) => ({
          id: index + 1,
          prompt: question.prompt,
          options:
            Array.isArray(question.options) && question.options.length === 4
              ? question.options
              : [
                  String(question.options?.[0] || "Option A"),
                  String(question.options?.[1] || "Option B"),
                  String(question.options?.[2] || "Option C"),
                  String(question.options?.[3] || "Option D"),
                ],
          selectedIndex:
            Number.isFinite(Number(question.selectedIndex)) && Number(question.selectedIndex) >= 0
              ? Number(question.selectedIndex)
              : 0,
          marks: String(Number.isFinite(Number(question.marks)) ? Number(question.marks) : 1),
        }))
      : [
          {
            id: 1,
            prompt: "What is the output of console.log(typeof null)?",
            options: ["null", "undefined", "object", "string"],
            selectedIndex: 2,
            marks: "1",
          },
          {
            id: 2,
            prompt: "Which method is used to add elements to the end of an array?",
            options: ["push()", "pop()", "shift()", "unshift()"],
            selectedIndex: 0,
            marks: "1",
          },
        ]
  );
  const [codingTasks, setCodingTasks] = useState<CodingTask[]>(
    initialDraft
      ? (
          Array.isArray(initialDraft.codingTasksDetailed) && initialDraft.codingTasksDetailed.length > 0
            ? initialDraft.codingTasksDetailed
            : (initialDraft.codingTaskItems.length > 0 ? initialDraft.codingTaskItems : ["Task 1"]).map((taskName) => ({
                taskName,
                language: "JavaScript",
                description: "Write the coding task statement here.",
                marks: 25,
                testCases: [{ input: "[input] , expected", expectedOutput: "[output]", isHidden: false, weight: 1 }],
              }))
        ).map((task, index) => ({
          id: index + 1,
          title: `Task ${index + 1}`,
          taskName: task.taskName || `Task ${index + 1}`,
          language: task.language || "JavaScript",
          description: task.description || "Write the coding task statement here.",
          marks: String(Number.isFinite(Number(task.marks)) ? Number(task.marks) : 25),
          testCases:
            Array.isArray(task.testCases) && task.testCases.length > 0
              ? task.testCases.map((testCase, tcIndex) => ({
                  id: tcIndex + 1,
                  input: String(testCase.input || ""),
                  expectedOutput: String(testCase.expectedOutput || ""),
                  isHidden: Boolean(testCase.isHidden),
                  weight: String(
                    Number.isFinite(Number(testCase.weight)) && Number(testCase.weight) > 0
                      ? Number(testCase.weight)
                      : 1
                  ),
                }))
              : [{ id: 1, input: "[input] , expected", expectedOutput: "[output]", isHidden: false, weight: "1" }],
        }))
      : [
          {
            id: 1,
            title: "Task 1",
            taskName: "Two Sum",
            language: "JavaScript",
            description:
              "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
            marks: "25",
            testCases: [
              { id: 1, input: "[2,7,11,15] , 9", expectedOutput: "[0,1]", isHidden: false, weight: "1" },
              { id: 2, input: "[3,2,4] , 6", expectedOutput: "[1,2]", isHidden: true, weight: "2" },
            ],
          },
          {
            id: 2,
            title: "Task 2",
            taskName: "Reverse String",
            language: "JavaScript",
            description:
              "Write a function that reverses a string. The input string is given as an array of characters.",
            marks: "25",
            testCases: [
              { id: 1, input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isHidden: false, weight: "1" },
            ],
          },
      ]
  );
  const [sectionPrompts, setSectionPrompts] = useState<Record<NonCodingSectionKey, SectionPromptItem[]>>(() => {
    const initial: Record<NonCodingSectionKey, SectionPromptItem[]> = {
      scenario: [{ id: 1, value: sectionDefaultPrompt.scenario }],
      portfolio_link: [{ id: 1, value: sectionDefaultPrompt.portfolio_link }],
      short_answer: [{ id: 1, value: sectionDefaultPrompt.short_answer }],
      long_answer: [{ id: 1, value: sectionDefaultPrompt.long_answer }],
      bug_report: [{ id: 1, value: sectionDefaultPrompt.bug_report }],
      test_case: [{ id: 1, value: sectionDefaultPrompt.test_case }],
    };
    const configs = initialDraft?.sectionConfigs || [];
    if (!configs.length) return initial;
    for (const key of nonCodingSectionKeys) {
      const matched = configs.filter((config) => config.key === key);
      if (matched.length) {
        initial[key] = matched.map((config, index) => ({
          id: index + 1,
          value: config.prompt || sectionDefaultPrompt[key],
        }));
      }
    }
    return initial;
  });

  useEffect(() => {
    if (initialDraft) return;
    if (!token) return;
    void (async () => {
      try {
        const local = readLocalSecurityDefaults();
        if (local) {
          setWarningLimit(String(local.warningLimit ?? 2));
          setAutoSaveInterval(String(local.autoSaveInterval ?? 60));
          setSecuritySettings((prev) => ({
            ...prev,
            forceFullscreen: local.forceFullscreen ?? prev.forceFullscreen,
            disableTabSwitch: local.disableTabSwitch ?? prev.disableTabSwitch,
            autoEndOnTabChange: local.autoEndOnTabChange ?? prev.autoEndOnTabChange,
            disableCopyPaste: local.disableCopyPaste ?? prev.disableCopyPaste,
            disableRightClick: local.disableRightClick ?? prev.disableRightClick,
            devToolsDetection: local.detectDevTools ?? prev.devToolsDetection,
          }));
        }

        const response = await getAdminSecurityDefaults(token);
        const latestLocal = readLocalSecurityDefaults();
        setWarningLimit(String(response.securityDefaults?.warningLimit ?? 2));
        setAutoSaveInterval(String(response.securityDefaults?.autoSaveInterval ?? 60));
        setSecuritySettings((prev) => ({
          ...prev,
          forceFullscreen:
            latestLocal?.forceFullscreen ??
            response.securityDefaults?.forceFullscreen ??
            prev.forceFullscreen,
          disableTabSwitch:
            latestLocal?.disableTabSwitch ??
            response.securityDefaults?.disableTabSwitch ??
            prev.disableTabSwitch,
          autoEndOnTabChange:
            latestLocal?.autoEndOnTabChange ??
            response.securityDefaults?.autoEndOnTabChange ??
            prev.autoEndOnTabChange,
          disableCopyPaste:
            latestLocal?.disableCopyPaste ??
            response.securityDefaults?.disableCopyPaste ??
            prev.disableCopyPaste,
          disableRightClick:
            latestLocal?.disableRightClick ??
            response.securityDefaults?.disableRightClick ??
            prev.disableRightClick,
          devToolsDetection:
            latestLocal?.detectDevTools ??
            response.securityDefaults?.detectDevTools ??
            prev.devToolsDetection,
        }));
        if (latestLocal) {
          setWarningLimit(String(latestLocal.warningLimit ?? response.securityDefaults?.warningLimit ?? 2));
          setAutoSaveInterval(String(latestLocal.autoSaveInterval ?? response.securityDefaults?.autoSaveInterval ?? 60));
        }
      } catch {
        // Keep local defaults if API fails.
      }
    })();
  }, [token]);

  const buildDefaultQuestion = (id: number): McqQuestion => ({
    id,
    prompt: "Write your question here...",
    options: ["Option A", "Option B", "Option C", "Option D"],
    selectedIndex: 0,
    marks: "1",
  });

  const buildDefaultCodingTask = (id: number): CodingTask => ({
    id,
    title: `Task ${id}`,
    taskName: "New Task",
    language: "JavaScript",
    description: "Write the coding task statement here.",
    marks: "25",
    testCases: [{ id: 1, input: "[input] , expected", expectedOutput: "[output]", isHidden: false, weight: "1" }],
  });

  const nonCodingEnabledSections = enabledSections.filter((section) =>
    nonCodingSectionKeys.includes(section as NonCodingSectionKey)
  ) as NonCodingSectionKey[];

  const sectionConfigsPayload = nonCodingEnabledSections.flatMap((sectionKey) =>
    (sectionPrompts[sectionKey] || []).map((item) => ({
      key: sectionKey,
      title: getSectionLabel(sectionKey),
      prompt: item.value?.trim() || sectionDefaultPrompt[sectionKey],
      instructions: "",
      required: true,
    }))
  );

  const upsertSectionPrompt = (section: NonCodingSectionKey, id: number, value: string) => {
    setSectionPrompts((prev) => ({
      ...prev,
      [section]: prev[section].map((item) => (item.id === id ? { ...item, value } : item)),
    }));
  };

  const addSectionPrompt = (section: NonCodingSectionKey) => {
    setSectionPrompts((prev) => {
      const nextId = prev[section].length + 1;
      return {
        ...prev,
        [section]: [...prev[section], { id: nextId, value: sectionDefaultPrompt[section] }],
      };
    });
  };

  const deleteSectionPrompt = (section: NonCodingSectionKey, id: number) => {
    setSectionPrompts((prev) => {
      const remaining = prev[section].filter((item) => item.id !== id);
      const normalized = (remaining.length > 0 ? remaining : [{ id: 1, value: "" }]).map((item, idx) => ({
        ...item,
        id: idx + 1,
      }));
      return { ...prev, [section]: normalized };
    });
  };

  function handleNext() {
    if (step === 1) {
      const nextErrors: BasicInfoErrors = {};
      if (!testName.trim()) nextErrors.testName = "Test Name is required.";
      if (!position.trim()) nextErrors.position = "Position is required.";

      const durationValue = Number.parseInt(totalDuration, 10);
      if (!totalDuration.trim()) {
        nextErrors.totalDuration = "Total Duration is required.";
      } else if (!Number.isFinite(durationValue) || durationValue <= 0) {
        nextErrors.totalDuration = "Total Duration must be greater than 0.";
      }

      const passValue = Number.parseInt(passPercentage, 10);
      if (!passPercentage.trim()) {
        nextErrors.passPercentage = "Pass Percentage is required.";
      } else if (!Number.isFinite(passValue) || passValue < 1 || passValue > 100) {
        nextErrors.passPercentage = "Pass Percentage must be between 1 and 100.";
      }

      const mcqValue = Number.parseInt(totalMcqs, 10);
      if (!totalMcqs.trim()) {
        nextErrors.totalMcqs = "Total MCQs is required.";
      } else if (!Number.isFinite(mcqValue) || mcqValue <= 0) {
        nextErrors.totalMcqs = "Total MCQs must be greater than 0.";
      }

      if (codingSectionEnabled) {
        const codingValue = Number.parseInt(totalCodingTasks, 10);
        if (!totalCodingTasks.trim()) {
          nextErrors.totalCodingTasks = "Total Coding Tasks is required.";
        } else if (!Number.isFinite(codingValue) || codingValue <= 0) {
          nextErrors.totalCodingTasks = "Total Coding Tasks must be greater than 0.";
        }
      }

      if (Object.keys(nextErrors).length > 0) {
        setBasicInfoErrors(nextErrors);
        return;
      }

      setBasicInfoErrors({});
      if (roleCategory !== "other") {
        setEnabledSections(rolePresetSections[roleCategory]);
      } else if (!enabledSections.length) {
        setEnabledSections(["mcq"]);
      }
      const parsedMcqs = Number.parseInt(totalMcqs, 10);
      const totalMcqsCount = Number.isFinite(parsedMcqs) && parsedMcqs > 0 ? parsedMcqs : 1;
      const parsedCodingTasks = Number.parseInt(totalCodingTasks, 10);
      const totalCodingTasksCount =
        Number.isFinite(parsedCodingTasks) && parsedCodingTasks > 0 ? parsedCodingTasks : 1;

      setMcqQuestions((prev) => {
        if (prev.length === totalMcqsCount) return prev;
        return Array.from(
          { length: totalMcqsCount },
          (_, idx) => prev[idx] ?? buildDefaultQuestion(idx + 1)
        ).map((item, idx) => ({
          ...item,
          id: idx + 1,
        }));
      });

      if (codingSectionEnabled) {
        setCodingTasks((prev) => {
          if (prev.length === totalCodingTasksCount) return prev;
          return Array.from(
            { length: totalCodingTasksCount },
            (_, idx) => prev[idx] ?? buildDefaultCodingTask(idx + 1)
          ).map((item, idx) => ({
            ...item,
            id: idx + 1,
            title: `Task ${idx + 1}`,
          }));
        });
      } else {
        setTotalCodingTasks("0");
      }
    }
    setStep((prev) => getNextStep(prev));
  }

  async function handlePublishTest() {
    setPublishError("");
    const duration = Number.parseInt(totalDuration, 10);
    const mcqs = Number.parseInt(totalMcqs, 10);
    const coding = Number.parseInt(totalCodingTasks, 10);
    const now = new Date();
    const created = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    let createdTest: AdminTestListItem | null = null;

    if (token) {
      try {
        createdTest = await saveAdminTest(token, {
          id: editingTestMeta?.id,
          testName: testName.trim() || "Untitled Test",
          position: position.trim() || "Not Specified",
          duration: Number.isFinite(duration) && duration > 0 ? duration : 60,
          passPercentage: Number.parseInt(passPercentage, 10) || 0,
          roleCategory,
          enabledSections,
          sectionConfigs: sectionConfigsPayload,
          status: publishStatus,
          warningLimit: Number.parseInt(warningLimit, 10) || 2,
          autoSaveIntervalSeconds: Number.parseInt(autoSaveInterval, 10) || 60,
          securityFlags: {
            forceFullscreen: securitySettings.forceFullscreen,
            disableTabSwitch: securitySettings.disableTabSwitch,
            autoEndOnTabChange: securitySettings.autoEndOnTabChange,
            disableCopyPaste: securitySettings.disableCopyPaste,
            disableRightClick: securitySettings.disableRightClick,
            devToolsDetection: securitySettings.devToolsDetection,
          },
          mcqQuestions: mcqQuestions.map((item) => ({
            prompt: item.prompt.trim() || "Question",
            options: item.options.map((option) => option.trim() || "Option"),
            selectedIndex: item.selectedIndex,
            marks: Number.parseInt(item.marks, 10) || 1,
          })),
          codingTasks: codingSectionEnabled
            ? codingTasks.map((item) => ({
                taskName: item.taskName.trim() || "Task",
                description: item.description.trim() || "Task description",
                language: item.language,
                marks: Number.parseInt(item.marks, 10) || 10,
                sampleInput: item.testCases.find((testCase) => !testCase.isHidden)?.input || item.testCases[0]?.input || "",
                sampleOutput:
                  item.testCases.find((testCase) => !testCase.isHidden)?.expectedOutput ||
                  item.testCases[0]?.expectedOutput ||
                  "",
                testCases: item.testCases.map((testCase) => ({
                  input: testCase.input,
                  expectedOutput: testCase.expectedOutput,
                  isHidden: testCase.isHidden,
                  weight: Number.parseInt(testCase.weight, 10) || 1,
                })),
              }))
            : [],
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to publish test";
        setPublishError(message);
        return;
      }
    } else {
      createdTest = savePublishedTest(
        {
          testName: testName.trim() || "Untitled Test",
          position: position.trim() || "Not Specified",
          duration: Number.isFinite(duration) && duration > 0 ? duration : 60,
          passPercentage: Number.parseInt(passPercentage, 10) || 0,
          roleCategory,
          enabledSections,
          sectionConfigs: sectionConfigsPayload,
          mcqs: Number.isFinite(mcqs) && mcqs > 0 ? mcqs : mcqQuestions.length || 1,
          coding: codingSectionEnabled ? (Number.isFinite(coding) && coding > 0 ? coding : codingTasks.length || 1) : 0,
          mcqQuestionItems: mcqQuestions.map((item) => item.prompt),
          codingTaskItems: codingSectionEnabled ? codingTasks.map((item) => item.taskName) : [],
          mcqQuestionsDetailed: mcqQuestions.map((item) => ({
            prompt: item.prompt,
            options: item.options,
            selectedIndex: item.selectedIndex,
            marks: Number.parseInt(item.marks, 10) || 1,
          })),
          codingTasksDetailed: codingSectionEnabled
            ? codingTasks.map((item) => ({
                taskName: item.taskName,
                language: item.language,
                description: item.description,
                marks: Number.parseInt(item.marks, 10) || 1,
                testCases: item.testCases.map((testCase) => ({
                  input: testCase.input,
                  expectedOutput: testCase.expectedOutput,
                  isHidden: testCase.isHidden,
                  weight: Number.parseInt(testCase.weight, 10) || 1,
                })),
              }))
            : [],
          status: publishStatus === "active" ? "Active" : "Draft",
          created,
        },
        editingTestMeta ? { id: editingTestMeta.id, passcode: editingTestMeta.passcode } : undefined
      );
    }

    if (!createdTest) return;
    setEditingTestMeta({ id: createdTest.id, passcode: createdTest.passcode });
    setPublishedTest(createdTest);
    setCopied(false);
    setShowPublishModal(true);
  }

  async function handleCopyPasscode() {
    if (!publishedTest?.passcode) return;

    try {
      await navigator.clipboard.writeText(publishedTest.passcode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-[#f8fafc]"}`}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar isDark={isDark} activeItem="create" />

        <section className="flex w-full flex-col">
          <AdminTopHeader isDark={isDark} onToggleTheme={toggleTheme} currentPage="Create Test" />

          <div className="flex-1 space-y-6 px-6 pb-8 pt-5">
            <CreateTestStepper
              currentStep={step}
              isDark={isDark}
              includeCodingStep
              stepThreeLabel={codingSectionEnabled ? "Coding Tasks" : "Assessment"}
            />

            {step === 1 ? (
              <CreateTestCard title="Basic Information" bodyClassName="min-h-[295px]" isDark={isDark}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <CreateTestField
                      label="Test Name"
                      value={testName}
                      placeholder="e.g., Frontend Developer Assessment"
                      inputHeight="large"
                      required
                      onChange={(value) => {
                        setTestName(value);
                        if (basicInfoErrors.testName) {
                          setBasicInfoErrors((prev) => ({ ...prev, testName: undefined }));
                        }
                      }}
                      isDark={isDark}
                    />
                    {basicInfoErrors.testName ? <p className="mt-1 text-sm text-red-600">{basicInfoErrors.testName}</p> : null}
                  </div>
                  <div>
                    <CreateTestField
                      label="Position"
                      value={position}
                      placeholder="e.g., Senior Frontend Developer"
                      inputHeight="large"
                      required
                      onChange={(value) => {
                        setPosition(value);
                        if (basicInfoErrors.position) {
                          setBasicInfoErrors((prev) => ({ ...prev, position: undefined }));
                        }
                      }}
                      isDark={isDark}
                    />
                    {basicInfoErrors.position ? <p className="mt-1 text-sm text-red-600">{basicInfoErrors.position}</p> : null}
                  </div>
                  <div>
                    <p className={`mb-2 text-base ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Role Category</p>
                    <AppDropdown
                      value={roleCategory}
                      onChange={(value) => {
                        const nextRole = (value as RoleCategory) || "developer";
                        setRoleCategory(nextRole);
                        if (nextRole !== "other") {
                          setEnabledSections(rolePresetSections[nextRole]);
                        }
                      }}
                      options={roleOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
                      ariaLabel="Role category"
                      className={`h-[52px] rounded-[8px] border ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef] bg-white"}`}
                      triggerClassName={`px-3 text-[16px] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}
                      chevronClassName={isDark ? "text-slate-400" : "text-[#98a2b3]"}
                      menuClassName={`rounded-[10px] border shadow-lg ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef] bg-white"}`}
                      optionClassName={`px-3 py-2 text-[15px] ${isDark ? "text-slate-200 hover:bg-slate-700" : "text-[#475569] hover:bg-[#f4f7ff]"}`}
                      selectedOptionClassName="bg-[#e9efff] text-[#1f3a8a]"
                    />
                  </div>
                  <div>
                    <CreateTestField
                      label="Total Duration (minutes)"
                      value={totalDuration}
                      placeholder="e.g., 60"
                      inputHeight="large"
                      required
                      onChange={(value) => {
                        setTotalDuration(value.replace(/[^0-9]/g, ""));
                        if (basicInfoErrors.totalDuration) {
                          setBasicInfoErrors((prev) => ({ ...prev, totalDuration: undefined }));
                        }
                      }}
                      isDark={isDark}
                    />
                    {basicInfoErrors.totalDuration ? <p className="mt-1 text-sm text-red-600">{basicInfoErrors.totalDuration}</p> : null}
                  </div>
                  <div>
                    <CreateTestField
                      label="Pass Percentage"
                      value={passPercentage}
                      placeholder="e.g., 50"
                      rightAddon={<span>%</span>}
                      inputHeight="large"
                      required
                      onChange={(value) => {
                        setPassPercentage(value.replace(/[^0-9]/g, ""));
                        if (basicInfoErrors.passPercentage) {
                          setBasicInfoErrors((prev) => ({ ...prev, passPercentage: undefined }));
                        }
                      }}
                      isDark={isDark}
                    />
                    {basicInfoErrors.passPercentage ? <p className="mt-1 text-sm text-red-600">{basicInfoErrors.passPercentage}</p> : null}
                  </div>
                  <div>
                    <CreateTestField
                      label="Total MCQs"
                      value={totalMcqs}
                      placeholder="e.g., 20"
                      inputHeight="large"
                      required
                      onChange={(value) => {
                        setTotalMcqs(value.replace(/[^0-9]/g, ""));
                        if (basicInfoErrors.totalMcqs) {
                          setBasicInfoErrors((prev) => ({ ...prev, totalMcqs: undefined }));
                        }
                      }}
                      isDark={isDark}
                    />
                    {basicInfoErrors.totalMcqs ? <p className="mt-1 text-sm text-red-600">{basicInfoErrors.totalMcqs}</p> : null}
                  </div>
                  {codingSectionEnabled ? (
                    <div>
                      <CreateTestField
                        label="Total Coding Tasks"
                        value={totalCodingTasks}
                        placeholder="e.g., 3"
                        inputHeight="large"
                        required
                        onChange={(value) => {
                          setTotalCodingTasks(value.replace(/[^0-9]/g, ""));
                          if (basicInfoErrors.totalCodingTasks) {
                            setBasicInfoErrors((prev) => ({ ...prev, totalCodingTasks: undefined }));
                          }
                        }}
                        isDark={isDark}
                      />
                      {basicInfoErrors.totalCodingTasks ? <p className="mt-1 text-sm text-red-600">{basicInfoErrors.totalCodingTasks}</p> : null}
                    </div>
                  ) : null}
                </div>
                {roleCategory === "other" ? (
                  <div className={`mt-4 rounded-[10px] border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-[#f8fafc]"}`}>
                    <p className={`mb-3 text-sm font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Custom Sections (Other)</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {sectionOptions.map((section) => {
                        const checked = enabledSections.includes(section.key);
                        return (
                          <button
                            key={section.key}
                            type="button"
                            onClick={() => {
                              setEnabledSections((prev) => {
                                if (prev.includes(section.key)) {
                                  if (prev.length === 1) return prev;
                                  return prev.filter((k) => k !== section.key);
                                }
                                return [...prev, section.key];
                              });
                            }}
                            className={`rounded-[8px] border px-3 py-2 text-left text-sm transition ${
                              checked
                                ? "border-[#1f3a8a] bg-[#eef2ff] text-[#1f3a8a]"
                                : isDark
                                  ? "border-slate-600 bg-slate-800 text-slate-200"
                                  : "border-[#dbe3ef] bg-white text-[#475569]"
                            }`}
                          >
                            {section.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </CreateTestCard>
            ) : null}

            {step === 2 ? (
              <CreateTestCard
                title="Add MCQ Questions"
                subtitle={`${mcqQuestions.length} Questions Added`}
                isDark={isDark}
              >
                <div className="flex justify-end">
                  <AppButton
                    variant="primary"
                    size="md"
                    leftIcon={<DiamondIcon />}
                    onClick={() =>
                      setMcqQuestions((prev) => [
                        ...prev,
                        {
                          id: prev.length + 1,
                          prompt: "Write your question here...",
                          options: ["Option A", "Option B", "Option C", "Option D"],
                          selectedIndex: 0,
                          marks: "1",
                        },
                      ])
                    }
                  >
                    Add Question
                  </AppButton>
                </div>
                {mcqQuestions.map((question) => (
                  <QuestionBlock
                    key={question.id}
                    title={`Q ${question.id}`}
                    prompt={question.prompt}
                    options={question.options}
                    selectedIndex={question.selectedIndex}
                    marks={question.marks}
                    onPromptChange={(value) =>
                      setMcqQuestions((prev) =>
                        prev.map((item) =>
                          item.id === question.id ? { ...item, prompt: value } : item
                        )
                      )
                    }
                    onDelete={() =>
                      setMcqQuestions((prev) =>
                        prev
                          .filter((item) => item.id !== question.id)
                          .map((item, idx) => ({ ...item, id: idx + 1 }))
                      )
                    }
                    onSelectOption={(selectedIndex) =>
                      setMcqQuestions((prev) =>
                        prev.map((item) =>
                          item.id === question.id ? { ...item, selectedIndex } : item
                        )
                      )
                    }
                    onOptionChange={(optionIndex, value) =>
                      setMcqQuestions((prev) =>
                        prev.map((item) =>
                          item.id === question.id
                            ? {
                                ...item,
                                options: item.options.map((option, idx) =>
                                  idx === optionIndex ? value : option
                                ),
                              }
                            : item
                        )
                      )
                    }
                    isDark={isDark}
                  />
                ))}
              </CreateTestCard>
            ) : null}

            {step === 3 ? (
              codingSectionEnabled ? (
                <CreateTestCard
                  title="Add Coding Tasks"
                  subtitle={`${codingTasks.length} Tasks Added`}
                  isDark={isDark}
                >
                  <div className="flex justify-end">
                    <AppButton
                      variant="primary"
                      size="md"
                      leftIcon={<DiamondIcon />}
                      onClick={() =>
                        setCodingTasks((prev) => [
                          ...prev,
                          {
                            id: prev.length + 1,
                            title: `Task ${prev.length + 1}`,
                            taskName: "New Task",
                            language: "JavaScript",
                            description: "Write the coding task statement here.",
                            marks: "25",
                            testCases: [
                              { id: 1, input: "[input] , expected", expectedOutput: "[output]", isHidden: false, weight: "1" },
                            ],
                          },
                        ])
                      }
                    >
                      Add Question
                    </AppButton>
                  </div>
                  {codingTasks.map((task) => (
                    <CodingTaskBlock
                      key={task.id}
                      title={task.title}
                      taskName={task.taskName}
                      language={task.language}
                      description={task.description}
                      marks={task.marks}
                      testCases={task.testCases}
                      onTaskNameChange={(value) =>
                        setCodingTasks((prev) =>
                          prev.map((item) =>
                            item.id === task.id ? { ...item, taskName: value } : item
                          )
                        )
                      }
                      onLanguageChange={(value) =>
                        setCodingTasks((prev) =>
                          prev.map((item) =>
                            item.id === task.id ? { ...item, language: value } : item
                          )
                        )
                      }
                      onDescriptionChange={(value) =>
                        setCodingTasks((prev) =>
                          prev.map((item) =>
                            item.id === task.id ? { ...item, description: value } : item
                          )
                        )
                      }
                      onMarksChange={(value) =>
                        setCodingTasks((prev) =>
                          prev.map((item) =>
                            item.id === task.id ? { ...item, marks: value } : item
                          )
                        )
                      }
                      onTestCaseInputChange={(caseId, value) =>
                        setCodingTasks((prev) =>
                          prev.map((item) =>
                            item.id === task.id
                              ? {
                                  ...item,
                                  testCases: item.testCases.map((testCase) =>
                                    testCase.id === caseId ? { ...testCase, input: value } : testCase
                                  ),
                                }
                              : item
                          )
                        )
                      }
                      onTestCaseOutputChange={(caseId, value) =>
                        setCodingTasks((prev) =>
                          prev.map((item) =>
                            item.id === task.id
                              ? {
                                  ...item,
                                  testCases: item.testCases.map((testCase) =>
                                    testCase.id === caseId ? { ...testCase, expectedOutput: value } : testCase
                                  ),
                                }
                              : item
                          )
                        )
                      }
                      onTestCaseWeightChange={(caseId, value) =>
                        setCodingTasks((prev) =>
                          prev.map((item) =>
                            item.id === task.id
                              ? {
                                  ...item,
                                  testCases: item.testCases.map((testCase) =>
                                    testCase.id === caseId ? { ...testCase, weight: value || "1" } : testCase
                                  ),
                                }
                              : item
                          )
                        )
                      }
                      onToggleTestCaseHidden={(caseId) =>
                        setCodingTasks((prev) =>
                          prev.map((item) =>
                            item.id === task.id
                              ? {
                                  ...item,
                                  testCases: item.testCases.map((testCase) =>
                                    testCase.id === caseId ? { ...testCase, isHidden: !testCase.isHidden } : testCase
                                  ),
                                }
                              : item
                          )
                        )
                      }
                      onAddTestCase={() =>
                        setCodingTasks((prev) =>
                          prev.map((item) =>
                            item.id === task.id
                              ? {
                                  ...item,
                                  testCases: [
                                    ...item.testCases,
                                    {
                                      id:
                                        item.testCases.length > 0
                                          ? Math.max(...item.testCases.map((testCase) => testCase.id)) + 1
                                          : 1,
                                      input: "[input]",
                                      expectedOutput: "[output]",
                                      isHidden: true,
                                      weight: "1",
                                    },
                                  ],
                                }
                              : item
                          )
                        )
                      }
                      onDeleteTestCase={(caseId) =>
                        setCodingTasks((prev) =>
                          prev.map((item) =>
                            item.id === task.id
                              ? {
                                  ...item,
                                  testCases:
                                    item.testCases.filter((testCase) => testCase.id !== caseId).length > 0
                                      ? item.testCases.filter((testCase) => testCase.id !== caseId)
                                      : [{ id: 1, input: "[input]", expectedOutput: "[output]", isHidden: false, weight: "1" }],
                                }
                              : item
                          )
                        )
                      }
                      onDelete={() =>
                        setCodingTasks((prev) =>
                          prev
                            .filter((item) => item.id !== task.id)
                            .map((item, idx) => ({
                              ...item,
                              id: idx + 1,
                              title: `Task ${idx + 1}`,
                            }))
                        )
                      }
                      isDark={isDark}
                    />
                  ))}
                </CreateTestCard>
              ) : (
                <CreateTestCard
                  title="Assessment Sections"
                  subtitle={`${enabledSections.filter((section) => nonCodingSectionKeys.includes(section as NonCodingSectionKey)).length} Sections Enabled`}
                  isDark={isDark}
                >
                  <div className="space-y-4">
                    {enabledSections
                      .filter((section) => nonCodingSectionKeys.includes(section as NonCodingSectionKey))
                      .map((section) => {
                        const sectionKey = section as NonCodingSectionKey;
                        const items = sectionPrompts[sectionKey] || [];
                        const isPortfolio = sectionKey === "portfolio_link";
                        const isLong = sectionKey === "scenario" || sectionKey === "long_answer";

                        return (
                          <article
                            key={sectionKey}
                            className={`rounded-[10px] border p-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0]"}`}
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <span
                                className={`rounded-[8px] border px-3 py-1 text-[30px] font-semibold [zoom:0.5] ${
                                  isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#3254a3] bg-[#f3f4f6] text-[#1f3a8a]"
                                }`}
                              >
                                {getSectionLabel(sectionKey)}
                              </span>
                              <AppButton
                                variant="secondary"
                                size="sm"
                                onClick={() => addSectionPrompt(sectionKey)}
                              >
                                Add
                              </AppButton>
                            </div>

                            <div className="space-y-2">
                              {items.map((item) => (
                                <div key={`${sectionKey}-${item.id}`} className="flex items-start gap-2">
                                  {isLong ? (
                                    <textarea
                                      value={item.value}
                                      onChange={(event) => upsertSectionPrompt(sectionKey, item.id, event.target.value)}
                                      className={`h-[86px] w-full resize-none rounded-[8px] border px-3 py-3 text-[16px] outline-none placeholder:text-[#98a2b3] ${
                                        isDark ? "border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400" : "border-[#dbe3ef] bg-white text-[#0f172a]"
                                      }`}
                                      placeholder={sectionDefaultPrompt[sectionKey]}
                                    />
                                  ) : (
                                    <input
                                      value={item.value}
                                      onChange={(event) => upsertSectionPrompt(sectionKey, item.id, event.target.value)}
                                      className={`h-[52px] w-full rounded-[8px] border px-3 text-[16px] outline-none placeholder:text-[#98a2b3] ${
                                        isDark ? "border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400" : "border-[#dbe3ef] bg-white text-[#0f172a]"
                                      }`}
                                      placeholder={isPortfolio ? "https://portfolio-link.com" : sectionDefaultPrompt[sectionKey]}
                                    />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => deleteSectionPrompt(sectionKey, item.id)}
                                    aria-label={`Delete ${getSectionLabel(sectionKey)} item ${item.id}`}
                                    className="mt-2 shrink-0"
                                  >
                                    <TrashIcon />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </article>
                        );
                      })}
                  </div>
                </CreateTestCard>
              )
            ) : null}

            {step === 4 ? (
              <CreateTestCard
                title="Security Configuration"
                subtitle="Configure Proctoring And Security Settings"
                icon={<SecurityIcon />}
                iconContainerClassName="bg-[#eff6ff] text-[#1f3a8a]"
                isDark={isDark}
              >
                <div className={`space-y-2 rounded-[10px] border p-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0]"}`}>
                  <CreateTestToggle
                    title="Force Fullscreen"
                    subtitle="Require Fullscreen Mode Throughout The Test"
                    checked={securitySettings.forceFullscreen}
                    onChange={(checked) => setSecuritySettings((prev) => ({ ...prev, forceFullscreen: checked }))}
                    isDark={isDark}
                  />
                  <CreateTestToggle
                    title="Disable Tab Switch"
                    subtitle="Detect And Warn On Tab Changes"
                    checked={securitySettings.disableTabSwitch}
                    onChange={(checked) => setSecuritySettings((prev) => ({ ...prev, disableTabSwitch: checked }))}
                    isDark={isDark}
                  />
                  <CreateTestToggle
                    title="Auto End on Tab Change"
                    subtitle="Automatically Submit Test On Tab Switch"
                    checked={securitySettings.autoEndOnTabChange}
                    onChange={(checked) => setSecuritySettings((prev) => ({ ...prev, autoEndOnTabChange: checked }))}
                    isDark={isDark}
                  />
                  <CreateTestToggle
                    title="Disable Copy/Paste"
                    subtitle="Block Clipboard Operations"
                    checked={securitySettings.disableCopyPaste}
                    onChange={(checked) => setSecuritySettings((prev) => ({ ...prev, disableCopyPaste: checked }))}
                    isDark={isDark}
                  />
                  <CreateTestToggle
                    title="Disable Right Click"
                    subtitle="Prevent Context Menu"
                    checked={securitySettings.disableRightClick}
                    onChange={(checked) => setSecuritySettings((prev) => ({ ...prev, disableRightClick: checked }))}
                    isDark={isDark}
                  />
                  <CreateTestToggle
                    title="DevTools Detection"
                    subtitle="Detect Browser Developer Tools"
                    checked={securitySettings.devToolsDetection}
                    onChange={(checked) => setSecuritySettings((prev) => ({ ...prev, devToolsDetection: checked }))}
                    isDark={isDark}
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className={`text-base font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Warning Limit</p>
                      <AppDropdown
                        value={warningLimit}
                        onChange={setWarningLimit}
                        options={[
                          { value: "1", label: "1 Warning" },
                          { value: "2", label: "2 Warnings" },
                          { value: "3", label: "3 Warnings" },
                          { value: "4", label: "4 Warnings" },
                        ]}
                        ariaLabel="Warning limit"
                        className={`h-[52px] rounded-[8px] border ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef] bg-white"}`}
                        triggerClassName={`px-3 text-[16px] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}
                        chevronClassName={isDark ? "text-slate-400" : "text-[#98a2b3]"}
                        menuClassName={`rounded-[10px] border shadow-lg ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef] bg-white"}`}
                        optionClassName={`px-3 py-2 text-[15px] ${isDark ? "text-slate-200 hover:bg-slate-700" : "text-[#475569] hover:bg-[#f4f7ff]"}`}
                        selectedOptionClassName="bg-[#e9efff] text-[#1f3a8a]"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className={`text-base font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Auto Save Interval</p>
                      <AppDropdown
                        value={autoSaveInterval}
                        onChange={setAutoSaveInterval}
                        options={[
                          { value: "30", label: "Every 30 seconds" },
                          { value: "60", label: "Every 60 seconds" },
                          { value: "120", label: "Every 120 seconds" },
                          { value: "300", label: "Every 5 minutes" },
                        ]}
                        ariaLabel="Auto save interval"
                        className={`h-[52px] rounded-[8px] border ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef] bg-white"}`}
                        triggerClassName={`px-3 text-[16px] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}
                        chevronClassName={isDark ? "text-slate-400" : "text-[#98a2b3]"}
                        menuClassName={`rounded-[10px] border shadow-lg ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef] bg-white"}`}
                        optionClassName={`px-3 py-2 text-[15px] ${isDark ? "text-slate-200 hover:bg-slate-700" : "text-[#475569] hover:bg-[#f4f7ff]"}`}
                        selectedOptionClassName="bg-[#e9efff] text-[#1f3a8a]"
                      />
                    </div>
                  </div>
                </div>
              </CreateTestCard>
            ) : null}

            {step === 5 ? (
              <CreateTestCard
                title="Review & Publish"
                subtitle="Review Your Test Configuration Before Publishing"
                icon={<ReviewPublishIcon />}
                iconContainerClassName="bg-[#eff6ff] text-[#1f3a8a]"
                isDark={isDark}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <CreateTestSummaryField label="Test Name" value={testName || "Front End Developer"} isDark={isDark} />
                  <CreateTestSummaryField label="Position" value={position || "Frontend Developer"} isDark={isDark} />
                  <CreateTestSummaryField
                    label="Role"
                    value={roleOptions.find((r) => r.value === roleCategory)?.label || "Developer"}
                    isDark={isDark}
                  />
                  <CreateTestSummaryField label="Duration" value={`${totalDuration || "60"} minutes`} isDark={isDark} />
                  <CreateTestSummaryField label="Pass Percentage" value={`${passPercentage || "70"}%`} isDark={isDark} />
                  <CreateTestSummaryField label="MCQ Questions" value={`${totalMcqs || mcqQuestions.length} Questions`} isDark={isDark} />
                  {codingSectionEnabled ? (
                    <CreateTestSummaryField label="Coding Tasks" value={`${totalCodingTasks || codingTasks.length} Tasks`} isDark={isDark} />
                  ) : null}
                  {!codingSectionEnabled ? (
                    <CreateTestSummaryField
                      label="Assessment Sections"
                      value={
                        enabledSections
                          .filter((section) => section !== "mcq")
                          .map((section) => getSectionLabel(section))
                          .join(", ") || "MCQs"
                      }
                      isDark={isDark}
                    />
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[32px] [zoom:0.5] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>Status:</span>
                  <AppSegmentedControl
                    options={[
                      { value: "draft", label: "Draft" },
                      { value: "active", label: "Active" },
                    ]}
                    value={publishStatus}
                    onChange={(value) => setPublishStatus(value as "draft" | "active")}
                    buttonClassName="min-w-[102px] px-5 py-2"
                  />
                </div>
                <AppButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  leftIcon={<PublishButtonIcon />}
                  onClick={handlePublishTest}
                >
                  Publish Test
                </AppButton>
              </CreateTestCard>
            ) : null}

            <CreateTestActionButtons
              showPrevious={step > 1}
              showNext={step < 5}
              onPrevious={() => setStep((prev) => getPreviousStep(prev))}
              onNext={handleNext}
            />
            {publishError ? <p className="text-sm text-red-600">{publishError}</p> : null}

            {showPublishModal && publishedTest ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 px-4">
                <div className={`w-full max-w-[520px] rounded-[14px] border p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)] ${isDark ? "border-slate-700 bg-slate-900" : "border-[#dbe3ef] bg-white"}`}>
                  <h3 className={`text-[34px] font-semibold tracking-[-0.51px] [zoom:0.58] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                    Test Published
                  </h3>
                  <p className={`mt-1 text-base ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>
                    Share this passcode with candidate to start this specific test.
                  </p>

                  <div className={`mt-5 rounded-[12px] border p-4 ${isDark ? "border-slate-700 bg-slate-800" : "border-[#dbe3ef] bg-[#f8fafc]"}`}>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>Test</p>
                    <p className={`mt-1 text-base font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{publishedTest.testName}</p>

                    <p className={`mt-4 text-sm ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>Unique Passcode</p>
                    <div className={`mt-2 flex items-center justify-between gap-3 rounded-[10px] border px-4 py-3 ${isDark ? "border-slate-600 bg-slate-900" : "border-[#c7d2fe] bg-[#eef2ff]"}`}>
                      <span className={`font-mono text-xl font-semibold tracking-[0.12em] ${isDark ? "text-slate-100" : "text-[#1f3a8a]"}`}>
                        {publishedTest.passcode}
                      </span>
                      <AppButton
                        variant={copied ? "secondary" : "primary"}
                        size="sm"
                        leftIcon={copied ? <CheckIcon /> : <CopyIcon />}
                        onClick={() => {
                          void handleCopyPasscode();
                        }}
                      >
                        {copied ? "Copied" : "Copy"}
                      </AppButton>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <AppButton variant="ghost" onClick={() => setShowPublishModal(false)}>
                      Close
                    </AppButton>
                    <AppButton
                      variant="primary"
                      onClick={() => {
                        setShowPublishModal(false);
                        router.push("/admin/test-list");
                      }}
                    >
                      Go To Test List
                    </AppButton>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <AdminFooter isDark={isDark} />
        </section>
      </div>
    </main>
  );
}

