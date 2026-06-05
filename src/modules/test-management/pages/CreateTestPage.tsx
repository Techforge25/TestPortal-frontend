"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAdminTheme } from "@/data.admin/shared/useAdminTheme";
import { AdminRouteGuard } from "@/components/shared/guards/AdminRouteGuard";
import { AppButton } from "@/components/shared/ui/AppButton";
import { AppDropdown } from "@/components/shared/ui/AppDropdown";
import { AppSegmentedControl } from "@/components/shared/ui/AppSegmentedControl";
import { CreateTestActionButtons } from "../components/CreateTestActionButtons";
import { CreateTestCard } from "../components/CreateTestCard";
import { CreateTestField } from "../components/CreateTestField";
import { CreateTestSummaryField } from "../components/CreateTestSummaryField";
import { CreateTestStepper, type CreateTestStep } from "../components/CreateTestStepper";
import { CreateTestToggle } from "../components/CreateTestToggle";
import { CreateTestStep1BasicInfoSection } from "../sections/CreateTestStep1BasicInfoSection";
import { CreateTestStep2McqSection } from "../sections/CreateTestStep2McqSection";
import { CreateTestStep3RoleConfigRouter } from "../sections/CreateTestStep3RoleConfigRouter";
import { CreateTestStep4SecuritySection } from "../sections/CreateTestStep4SecuritySection";
import { CreateTestStep5ReviewPublishSection } from "../sections/CreateTestStep5ReviewPublishSection";
import { getNextStep, getPreviousStep, getStepperMeta } from "../constants/createTest.stepper";
import { nonCodingSectionKeys, roleOptions, rolePresetSections, sectionDefaultPrompt, sectionOptions } from "../constants/createTest.wizard";
import type {
  BasicInfoErrors,
  CreateTestCodingTask,
  CreateTestMcqQuestion,
  CreateTestRole as RoleCategory,
  CreateTestSectionKey as SectionKey,
  NonCodingSectionKey,
} from "../types/createTest.types";
import {
  buildBugReportPrompt,
  buildDesignerUiTaskPrompt as buildDesignerUiTaskPromptBase,
  buildUiPreviewPrompt as buildUiPreviewPromptBase,
  editorHtmlToPlainText,
  parseBugReportPrompt,
  parseDesignerUiTaskPrompt as parseDesignerUiTaskPromptBase,
  parseUiPreviewPrompt as parseUiPreviewPromptBase,
  plainTextToEditorHtml,
  readLocalSecurityDefaults,
  type BugReportPromptPayload,
  type DesignerUiTaskPromptPayload,
  type LocalSecurityDefaults,
  type SectionPromptItem,
  type UiPreviewPromptPayload,
} from "../utils/createTest.helpers";
import { getAdminToken } from "@/data.admin/shared/adminAuthStorage";
import {
  getAdminSecurityDefaults,
  saveAdminTest,
  uploadAdminCkeditorImage,
  uploadAdminUiPreviewImage,
  uploadAdminUiTaskPdf,
} from "../services/createTestService";
import {
  clearEditingTestDraft,
  readEditingTestDraft,
  type AdminTestListItem,
} from "@/data.admin/shared/testListStorage";
import { buildCreateTestSavePayload } from "../mappers/createTestPayload.mapper";
import {
  buildDefaultCodingTask,
  buildDefaultQuestion,
} from "../utils/createTestDefaults";
import {
  distributeIntegerMarks,
  getCodingMarksPool,
  MAX_MCQ_QUESTIONS,
  normalizeMcqCount,
} from "../utils/createTestMarks";
import { useCreateTestWizard } from "../hooks/useCreateTestWizard";

const  CKEditor = dynamic(
  async () => {
    const mod = await import("@ckeditor/ckeditor5-react");
    return mod.CKEditor;
  },
  { ssr: false }
);

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

function PublishLoader({ isDark }: { isDark: boolean }) {
  return (
    <div className={`fixed inset-0 z-[90] flex items-center justify-center ${isDark ? "bg-slate-950/70" : "bg-slate-900/25"} backdrop-blur-sm`}>
      <div className={`flex min-w-[240px] flex-col items-center gap-3 rounded-[16px] border px-6 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.24)] ${isDark ? "border-slate-700 bg-slate-900" : "border-[#dbe3ef] bg-white"}`}>
        <div className={`size-12 animate-spin rounded-full border-[3px] border-t-transparent ${isDark ? "border-slate-300 border-t-transparent" : "border-[#1f3a8a] border-t-transparent"}`} />
        <div className="text-center">
          <p className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Publishing test...</p>
          <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>Please wait while we create your test.</p>
        </div>
      </div>
    </div>
  );
}

const parseUiPreviewPrompt = (raw: string): UiPreviewPromptPayload =>
  parseUiPreviewPromptBase(raw, sectionDefaultPrompt);
const buildUiPreviewPrompt = (value: UiPreviewPromptPayload): string =>
  buildUiPreviewPromptBase(value, sectionDefaultPrompt);
const parseDesignerUiTaskPrompt = (raw: string): DesignerUiTaskPromptPayload =>
  parseDesignerUiTaskPromptBase(raw, sectionDefaultPrompt);
const buildDesignerUiTaskPrompt = (value: DesignerUiTaskPromptPayload): string =>
  buildDesignerUiTaskPromptBase(value, sectionDefaultPrompt);
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
  codingLanguageOptions,
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
  codingLanguageOptions: string[];
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
          options={codingLanguageOptions.map((option) => ({ value: option, label: option }))}
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
  const { step, setStep } = useCreateTestWizard(1);
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
  const [isPublishing, setIsPublishing] = useState(false);
  const [basicInfoErrors, setBasicInfoErrors] = useState<BasicInfoErrors>({});
  const [editorConstructor, setEditorConstructor] = useState<unknown>(null);
  const [editorConfig, setEditorConfig] = useState<Record<string, unknown>>({
    toolbar: [
      "undo",
      "redo",
      "|",
      "bold",
      "italic",
      "link",
      "|",
      "bulletedList",
      "numberedList",
      "insertTable",
      "|",
      "blockQuote",
    ],
    placeholder: "Write a bug report analysis question.",
  });
  const bugReportDescriptionHtmlDraftRef = useRef<Record<string, string>>({});
  const bugReportWebsiteDraftRef = useRef<Record<string, string>>({});
  const isPublishingRef = useRef(false);
  const [bugReportImageUploadingByKey, setBugReportImageUploadingByKey] = useState<Record<string, boolean>>({});
  const [bugReportImageUploadErrorByKey, setBugReportImageUploadErrorByKey] = useState<Record<string, string>>({});
  const [uiPreviewUploadErrors, setUiPreviewUploadErrors] = useState<Record<string, string>>({});
  const [uiPreviewUploading, setUiPreviewUploading] = useState<Record<string, boolean>>({});
  const [designerUiTaskUploadErrors, setDesignerUiTaskUploadErrors] = useState<Record<string, string>>({});
  const [securitySettings, setSecuritySettings] = useState({
    forceFullscreen: initialDraft?.securityFlags?.forceFullscreen ?? true,
    disableTabSwitch: initialDraft?.securityFlags?.disableTabSwitch ?? true,
    autoEndOnTabChange: initialDraft?.securityFlags?.autoEndOnTabChange ?? false,
    disableCopyPaste: initialDraft?.securityFlags?.disableCopyPaste ?? true,
    disableRightClick: initialDraft?.securityFlags?.disableRightClick ?? true,
    devToolsDetection: initialDraft?.securityFlags?.devToolsDetection ?? true,
  });
  const codingSectionEnabled = enabledSections.includes("coding");

  const getSectionLabelForRole = (sectionKey: string) => {
    if (roleCategory === "designer" && sectionKey === "portfolio_link") return "UI Task";
    return getSectionLabel(sectionKey);
  };
  const isFrontendRole = roleCategory === "frontend";
  const isQaManualRole = roleCategory === "qa_manual";
  const stepperMeta = getStepperMeta(roleCategory, codingSectionEnabled);
  const maxStep = 5;
  const frontendStepperSteps: Array<{ id: CreateTestStep; label: string }> = [
    { id: 1, label: "Basic Info" },
    { id: 2, label: "Add MCQs" },
    { id: 3, label: "UI Preview Task" },
    { id: 4, label: "Security" },
    { id: 5, label: "Publish" },
  ];

  useEffect(() => {
    let mounted = true;
    const stableConfig = {
      toolbar: [
        "undo",
        "redo",
        "|",
        "bold",
        "italic",
        "link",
        "|",
        "bulletedList",
        "numberedList",
        "insertTable",
        "|",
        "blockQuote",
        "|",
        "uploadImage",
      ],
      placeholder: "Write a bug report analysis question.",
      image: {
        toolbar: [
          "imageTextAlternative",
          "|",
          "imageStyle:inline",
          "imageStyle:block",
          "imageStyle:side",
          "|",
          "resizeImage:25",
          "resizeImage:50",
          "resizeImage:75",
          "resizeImage:original",
        ],
        resizeOptions: [
          {
            name: "resizeImage:original",
            value: null,
            label: "Original",
          },
          {
            name: "resizeImage:25",
            value: "25",
            label: "25%",
          },
          {
            name: "resizeImage:50",
            value: "50",
            label: "50%",
          },
          {
            name: "resizeImage:75",
            value: "75",
            label: "75%",
          },
        ],
      },
    };

    void import("@ckeditor/ckeditor5-build-classic")
      .then((mod) => {
        if (!mounted) return;
        const runtime = mod as unknown as { default?: { default?: unknown } | unknown };
        const editor = runtime.default && typeof runtime.default === "object" && "default" in runtime.default
          ? (runtime.default as { default?: unknown }).default
          : runtime.default ?? mod;
        const editorCtor = editor as { create?: unknown };
        const hasCreate =
          editor && typeof editor === "function" && typeof editorCtor.create === "function";
        setEditorConstructor(() => (hasCreate ? editor : null));
        setEditorConfig(stableConfig);
      })
      .catch(() => {
        if (!mounted) return;
        setEditorConstructor(null);
        setEditorConfig(stableConfig);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const uploadCkeditorImage = async (file: File) => {
    const activeToken = getAdminToken();
    if (!activeToken) {
      throw new Error("Admin session missing. Please login again and retry.");
    }
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed.");
    }
    if (file.size > 2_000_000) {
      throw new Error("Image is too large. Use image up to 2MB.");
    }
    const dataUrl = await readFileAsDataUrl(file);
    const uploaded = await uploadAdminCkeditorImage(activeToken, {
      dataUrl,
      fileName: file.name,
    });
    if (!/^https?:\/\//i.test(String(uploaded.url || ""))) {
      throw new Error("Invalid image URL returned by upload service.");
    }
    return uploaded.url;
  };

  const formatCkeditorUploadError = (error: unknown): string => {
    const raw = error instanceof Error ? error.message : "Failed to upload image.";
    const lower = raw.toLowerCase();
    if (lower.includes("route not found")) {
      return "Image upload endpoint not found on backend. Restart/deploy latest backend.";
    }
    if (lower.includes("session missing") || lower.includes("unauthorized")) {
      return "Session expired. Login again and retry upload.";
    }
    if (lower.includes("too large")) {
      return "Image size exceeded. Please use image up to 2MB.";
    }
    if (lower.includes("only image")) {
      return "Only JPG, PNG, WebP image files are supported.";
    }
    return raw;
  };

  useEffect(() => {
    if (step > maxStep) setStep(maxStep as CreateTestStep);
  }, [maxStep, setStep, step]);

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
  const [mcqQuestions, setMcqQuestions] = useState<CreateTestMcqQuestion[]>(
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
  const [codingTasks, setCodingTasks] = useState<CreateTestCodingTask[]>(
    initialDraft
      ? (
          Array.isArray(initialDraft.codingTasksDetailed) && initialDraft.codingTasksDetailed.length > 0
            ? initialDraft.codingTasksDetailed
            : (initialDraft.codingTaskItems.length > 0 ? initialDraft.codingTaskItems : ["Task 1"]).map((taskName) => ({
                taskName,
                language: "JavaScript",
                description: "Write the coding task statement here.",
                marks: 0,
                testCases: [{ input: "[input] , expected", expectedOutput: "[output]", isHidden: false, weight: 1 }],
              }))
        ).map((task, index) => ({
          id: index + 1,
          title: `Task ${index + 1}`,
          taskName: task.taskName || `Task ${index + 1}`,
          language: task.language || "JavaScript",
          description: task.description || "Write the coding task statement here.",
          marks: String(Number.isFinite(Number(task.marks)) ? Number(task.marks) : 0),
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
            marks: "0",
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
            marks: "0",
            testCases: [
              { id: 1, input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isHidden: false, weight: "1" },
            ],
          },
      ]
  );
  const [sectionPrompts, setSectionPrompts] = useState<Record<NonCodingSectionKey, SectionPromptItem[]>>(() => {
    const initial: Record<NonCodingSectionKey, SectionPromptItem[]> = {
      ui_preview: [{ id: 1, value: sectionDefaultPrompt.ui_preview, marks: "10" }],
      scenario: [{ id: 1, value: sectionDefaultPrompt.scenario, marks: "0" }],
      portfolio_link: [{ id: 1, value: sectionDefaultPrompt.portfolio_link, marks: "0" }],
      short_answer: [{ id: 1, value: sectionDefaultPrompt.short_answer, marks: "0" }],
      long_answer: [{ id: 1, value: sectionDefaultPrompt.long_answer, marks: "0" }],
      bug_report: [{ id: 1, value: sectionDefaultPrompt.bug_report, marks: "0" }],
      test_case: [{ id: 1, value: sectionDefaultPrompt.test_case, marks: "0" }],
    };
    const configs = initialDraft?.sectionConfigs || [];
    if (!configs.length) return initial;
    for (const key of nonCodingSectionKeys) {
      const matched = configs.filter((config) => config.key === key);
      if (matched.length) {
        initial[key] = matched.map((config, index) => ({
          id: index + 1,
          value: config.prompt || sectionDefaultPrompt[key],
          marks: String(Number.isFinite(Number((config as { marks?: number })?.marks)) ? Number((config as { marks?: number })?.marks) : key === "ui_preview" ? 10 : 0),
        }));
      }
    }
    return initial;
  });

  useEffect(() => {
    setMcqQuestions((prev) =>
      prev.map((question) => (question.marks === "1" ? question : { ...question, marks: "1" }))
    );
  }, [totalMcqs]);

  useEffect(() => {
    if (!codingSectionEnabled) return;
    const distributedMarks = distributeIntegerMarks(
      getCodingMarksPool(normalizeMcqCount(totalMcqs)),
      codingTasks.length
    );
    setCodingTasks((prev) =>
      prev.map((task, index) => {
        const nextMarks = String(distributedMarks[index] ?? 0);
        return task.marks === nextMarks ? task : { ...task, marks: nextMarks };
      })
    );
  }, [codingSectionEnabled, codingTasks.length, totalMcqs]);

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
  }, [token, initialDraft]);

  const nonCodingEnabledSections = enabledSections.filter((section) =>
    nonCodingSectionKeys.includes(section as NonCodingSectionKey)
  ) as NonCodingSectionKey[];
  const canUseUiPreview = roleCategory === "frontend";

  const sectionConfigsPayload = nonCodingEnabledSections.flatMap((sectionKey) =>
    (sectionPrompts[sectionKey] || []).map((item) => {
      if (sectionKey === "bug_report") {
        const parsed = parseBugReportPrompt(item.value || "");
        const draftKey = `${sectionKey}-${item.id}`;
        const draftWebsite = (bugReportWebsiteDraftRef.current[draftKey] || "").trim();
        const draftHtml = (bugReportDescriptionHtmlDraftRef.current[draftKey] || "").trim();
        const normalizedHtml = draftHtml || parsed.descriptionHtml || plainTextToEditorHtml(parsed.description);
        const normalizedText = editorHtmlToPlainText(normalizedHtml).slice(0, 5000);

        return {
          key: sectionKey,
          title: getSectionLabelForRole(sectionKey),
          prompt: buildBugReportPrompt({
            websiteLink: draftWebsite || parsed.websiteLink,
            description: normalizedText,
            descriptionHtml: normalizedHtml,
          }),
          instructions: "",
          required: true,
          marks: 1,
        };
      }

      return {
        key: sectionKey,
        title: getSectionLabelForRole(sectionKey),
        prompt:
          sectionKey === "ui_preview"
            ? buildUiPreviewPrompt(parseUiPreviewPrompt(item.value || ""))
            : roleCategory === "designer" && sectionKey === "portfolio_link"
              ? buildDesignerUiTaskPrompt(parseDesignerUiTaskPrompt(item.value || ""))
            : item.value?.trim() || sectionDefaultPrompt[sectionKey],
        instructions: "",
        required: true,
        marks:
          sectionKey === "ui_preview"
            ? Number.parseInt(item.marks || "10", 10) || 10
            : 1,
      };
    })
  );

  const upsertSectionPrompt = (section: NonCodingSectionKey, id: number, value: string) => {
    setSectionPrompts((prev) => ({
      ...prev,
      [section]: prev[section].map((item) => (item.id === id ? { ...item, value } : item)),
    }));
  };

  const upsertSectionMarks = (section: NonCodingSectionKey, id: number, marks: string) => {
    const sanitized = marks.replace(/[^0-9]/g, "");
    setSectionPrompts((prev) => ({
      ...prev,
      [section]: prev[section].map((item) => (item.id === id ? { ...item, marks: sanitized } : item)),
    }));
  };

  const addSectionPrompt = (section: NonCodingSectionKey) => {
    setSectionPrompts((prev) => {
      const nextId = prev[section].length + 1;
      return {
        ...prev,
        [section]: [...prev[section], { id: nextId, value: sectionDefaultPrompt[section], marks: section === "ui_preview" ? "10" : "0" }],
      };
    });
  };

  const deleteSectionPrompt = (section: NonCodingSectionKey, id: number) => {
    setSectionPrompts((prev) => {
      const remaining = prev[section].filter((item) => item.id !== id);
      const normalized = (remaining.length > 0 ? remaining : [{ id: 1, value: "", marks: section === "ui_preview" ? "10" : "0" }]).map((item, idx) => ({
        ...item,
        id: idx + 1,
      }));
      return { ...prev, [section]: normalized };
    });
    Object.keys(bugReportDescriptionHtmlDraftRef.current).forEach((key) => {
      if (key.startsWith(`${section}-`)) {
        delete bugReportDescriptionHtmlDraftRef.current[key];
      }
    });
    Object.keys(bugReportWebsiteDraftRef.current).forEach((key) => {
      if (key.startsWith(`${section}-`)) {
        delete bugReportWebsiteDraftRef.current[key];
      }
    });
    setUiPreviewUploadErrors((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${section}-`)))
    );
    setUiPreviewUploading((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${section}-`)))
    );
    setDesignerUiTaskUploadErrors((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${section}-`)))
    );
    setBugReportImageUploadingByKey((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${section}-`)))
    );
    setBugReportImageUploadErrorByKey((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(`${section}-`)))
    );
  };

  useEffect(() => {
    if (canUseUiPreview) return;
    if (!enabledSections.includes("ui_preview")) return;
    setEnabledSections((prev) => prev.filter((item) => item !== "ui_preview"));
  }, [canUseUiPreview, enabledSections]);

  const readUiPreviewError = (section: NonCodingSectionKey, id: number) =>
    uiPreviewUploadErrors[`${section}-${id}`] || "";
  const readDesignerUiTaskError = (section: NonCodingSectionKey, id: number) =>
    designerUiTaskUploadErrors[`${section}-${id}`] || "";

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });

  const applyUiPreviewFile = async (
    section: NonCodingSectionKey,
    id: number,
    file: File,
    currentValue: UiPreviewPromptPayload
  ) => {
    const errorKey = `${section}-${id}`;
    const typeOk = file.type.startsWith("image/");
    if (!typeOk) {
      setUiPreviewUploadErrors((prev) => ({
        ...prev,
        [errorKey]: "Only image files are allowed (PNG/JPG/WebP).",
      }));
      return;
    }
    if (file.size > 1_500_000) {
      setUiPreviewUploadErrors((prev) => ({
        ...prev,
        [errorKey]: "Image is too large. Use image up to 1.5MB.",
      }));
      return;
    }

    try {
      setUiPreviewUploading((prev) => ({ ...prev, [errorKey]: true }));
      const dataUrl = await readFileAsDataUrl(file);
      if (!token) {
        throw new Error("Admin session missing. Please login again and retry.");
      }

      const uploaded = await uploadAdminUiPreviewImage(token, {
        dataUrl,
        fileName: file.name,
      });
      upsertSectionPrompt(
        section,
        id,
        buildUiPreviewPrompt({
          ...currentValue,
          referenceImageUrl: uploaded.url,
        })
      );

      setUiPreviewUploadErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      setUiPreviewUploadErrors((prev) => ({ ...prev, [errorKey]: message }));
    } finally {
      setUiPreviewUploading((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
  };

  const applyDesignerUiTaskPdf = async (
    section: NonCodingSectionKey,
    id: number,
    file: File,
    currentValue: DesignerUiTaskPromptPayload
  ) => {
    const errorKey = `${section}-${id}`;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setDesignerUiTaskUploadErrors((prev) => ({
        ...prev,
        [errorKey]: "Only PDF file is allowed.",
      }));
      return;
    }
    if (file.size > 5_000_000) {
      setDesignerUiTaskUploadErrors((prev) => ({
        ...prev,
        [errorKey]: "PDF is too large. Use file up to 5MB.",
      }));
      return;
    }

    if (!token) {
      setDesignerUiTaskUploadErrors((prev) => ({
        ...prev,
        [errorKey]: "Admin session missing. Please login again and retry.",
      }));
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const uploaded = await uploadAdminUiTaskPdf(token, {
        dataUrl,
        fileName: file.name,
      });
      if (!/^https?:\/\//i.test(String(uploaded.url || ""))) {
        throw new Error("Invalid PDF URL returned by upload service.");
      }

      upsertSectionPrompt(
        section,
        id,
        buildDesignerUiTaskPrompt({
          ...currentValue,
          pdfUrl: uploaded.url,
          pdfFileName: file.name,
        })
      );
      setDesignerUiTaskUploadErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Failed to upload PDF";
      const message =
        rawMessage.toLowerCase().includes("route not found")
          ? "PDF upload endpoint not found on backend. Deploy latest backend changes."
          : rawMessage;
      setDesignerUiTaskUploadErrors((prev) => ({
        ...prev,
        [errorKey]: message,
      }));
    }
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
      } else if (mcqValue > MAX_MCQ_QUESTIONS) {
        nextErrors.totalMcqs = `Total MCQs cannot be more than ${MAX_MCQ_QUESTIONS}.`;
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
      const totalMcqsCount = normalizeMcqCount(totalMcqs);
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
          marks: "1",
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
    setStep((prev) => {
      const next = getNextStep(prev);
      return (next > maxStep ? maxStep : next) as CreateTestStep;
    });
  }

  async function handlePublishTest() {
    if (isPublishingRef.current) return;
    setPublishError("");
    const liveToken = getAdminToken();
    if (!liveToken) {
      setPublishError("Admin session expired. Please login again.");
      router.push("/admin");
      return;
    }
    let createdTest: AdminTestListItem | null = null;
    isPublishingRef.current = true;
    setIsPublishing(true);

    try {
      createdTest = await saveAdminTest(
        liveToken,
        buildCreateTestSavePayload({
          editingTestId: editingTestMeta?.id,
          testName,
          position,
          totalDuration,
          passPercentage,
          roleCategory,
          enabledSections,
          sectionConfigs: sectionConfigsPayload,
          publishStatus,
          warningLimit,
          autoSaveInterval,
          securitySettings,
          mcqQuestions,
          codingSectionEnabled,
          codingTasks,
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to publish test";
      setPublishError(message);
      return;
    } finally {
      isPublishingRef.current = false;
      setIsPublishing(false);
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
      {isPublishing ? <PublishLoader isDark={isDark} /> : null}
      <div className="flex min-h-screen w-full">
        <section className="flex w-full flex-col">
          <div className="flex-1 space-y-6 px-6 pb-8 pt-5">
            <CreateTestStepper
              currentStep={step}
              isDark={isDark}
              includeCodingStep={stepperMeta.includeCodingStep}
              stepThreeLabel={stepperMeta.stepThreeLabel}
              customSteps={stepperMeta.useFrontendCustomSteps ? frontendStepperSteps : undefined}
            />

            <CreateTestStep1BasicInfoSection step={step} isDark={isDark} testName={testName} setTestName={setTestName} basicInfoErrors={basicInfoErrors} setBasicInfoErrors={setBasicInfoErrors} position={position} setPosition={setPosition} roleCategory={roleCategory} setRoleCategory={setRoleCategory} setEnabledSections={setEnabledSections} totalDuration={totalDuration} setTotalDuration={setTotalDuration} passPercentage={passPercentage} setPassPercentage={setPassPercentage} totalMcqs={totalMcqs} setTotalMcqs={setTotalMcqs} codingSectionEnabled={codingSectionEnabled} totalCodingTasks={totalCodingTasks} setTotalCodingTasks={setTotalCodingTasks} enabledSections={enabledSections} canUseUiPreview={canUseUiPreview} />

            

            <CreateTestStep2McqSection step={step} isDark={isDark} mcqQuestions={mcqQuestions} setMcqQuestions={setMcqQuestions} />

            <CreateTestStep3RoleConfigRouter roleCategory={roleCategory} step={step} codingSectionEnabled={codingSectionEnabled} isFrontendRole={isFrontendRole} isDark={isDark} codingTasks={codingTasks} setCodingTasks={setCodingTasks} isQaManualRole={isQaManualRole} enabledSections={enabledSections} nonCodingSectionKeys={nonCodingSectionKeys} sectionPrompts={sectionPrompts} getSectionLabelForRole={getSectionLabelForRole} addSectionPrompt={addSectionPrompt} parseUiPreviewPrompt={parseUiPreviewPrompt} buildUiPreviewPrompt={buildUiPreviewPrompt} upsertSectionPrompt={upsertSectionPrompt} applyUiPreviewFile={applyUiPreviewFile} readUiPreviewError={readUiPreviewError} uiPreviewUploading={uiPreviewUploading} parseDesignerUiTaskPrompt={parseDesignerUiTaskPrompt} applyDesignerUiTaskPdf={applyDesignerUiTaskPdf} readDesignerUiTaskError={readDesignerUiTaskError} parseBugReportPrompt={parseBugReportPrompt} bugReportImageUploadErrorByKey={bugReportImageUploadErrorByKey} bugReportImageUploadingByKey={bugReportImageUploadingByKey} bugReportWebsiteDraftRef={bugReportWebsiteDraftRef} bugReportDescriptionHtmlDraftRef={bugReportDescriptionHtmlDraftRef} plainTextToEditorHtml={plainTextToEditorHtml} editorConstructor={editorConstructor} CKEditor={CKEditor} editorConfig={editorConfig} uploadCkeditorImage={uploadCkeditorImage} formatCkeditorUploadError={formatCkeditorUploadError} setBugReportImageUploadErrorByKey={setBugReportImageUploadErrorByKey} setBugReportImageUploadingByKey={setBugReportImageUploadingByKey} editorHtmlToPlainText={editorHtmlToPlainText} buildBugReportPrompt={buildBugReportPrompt} sectionDefaultPrompt={sectionDefaultPrompt} upsertSectionMarks={upsertSectionMarks} deleteSectionPrompt={deleteSectionPrompt} TrashIcon={TrashIcon} />            

            <CreateTestStep4SecuritySection step={step} isDark={isDark} SecurityIcon={SecurityIcon} securitySettings={securitySettings} setSecuritySettings={setSecuritySettings} warningLimit={warningLimit} setWarningLimit={setWarningLimit} autoSaveInterval={autoSaveInterval} setAutoSaveInterval={setAutoSaveInterval} />

            <CreateTestStep5ReviewPublishSection step={step} isDark={isDark} ReviewPublishIcon={ReviewPublishIcon} testName={testName} position={position} roleOptions={roleOptions} roleCategory={roleCategory} totalDuration={totalDuration} passPercentage={passPercentage} totalMcqs={totalMcqs} mcqQuestions={mcqQuestions} codingSectionEnabled={codingSectionEnabled} totalCodingTasks={totalCodingTasks} codingTasks={codingTasks} isQaManualRole={isQaManualRole} enabledSections={enabledSections} getSectionLabelForRole={getSectionLabelForRole} publishStatus={publishStatus} setPublishStatus={setPublishStatus} PublishButtonIcon={PublishButtonIcon} handlePublishTest={handlePublishTest} isPublishing={isPublishing} />

            

            <CreateTestActionButtons
              showPrevious={step > 1}
              showNext={step < maxStep}
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
        </section>
      </div>
    </main>
  );
}

export default function CreateTestPage() {
  return (
    <AdminRouteGuard>
      <AdminCreateTestScreen />
    </AdminRouteGuard>
  );
}
