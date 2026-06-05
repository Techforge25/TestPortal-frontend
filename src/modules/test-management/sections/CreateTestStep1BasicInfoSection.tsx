import { CreateTestCard } from "../components/CreateTestCard";
import { CreateTestField } from "../components/CreateTestField";
import { AppDropdown } from "@/components/shared/ui/AppDropdown";
import { roleOptions, rolePresetSections, sectionOptions } from "../constants/createTest.wizard";
import type { BasicInfoErrors, CreateTestRole } from "../types/createTest.types";

type Props = {
  step: number;
  isDark: boolean;
  testName: string;
  setTestName: React.Dispatch<React.SetStateAction<string>>;
  basicInfoErrors: BasicInfoErrors;
  setBasicInfoErrors: React.Dispatch<React.SetStateAction<BasicInfoErrors>>;
  position: string;
  setPosition: React.Dispatch<React.SetStateAction<string>>;
  roleCategory: CreateTestRole;
  setRoleCategory: React.Dispatch<React.SetStateAction<CreateTestRole>>;
  setEnabledSections: React.Dispatch<React.SetStateAction<string[]>>;
  totalDuration: string;
  setTotalDuration: React.Dispatch<React.SetStateAction<string>>;
  passPercentage: string;
  setPassPercentage: React.Dispatch<React.SetStateAction<string>>;
  totalMcqs: string;
  setTotalMcqs: React.Dispatch<React.SetStateAction<string>>;
  codingSectionEnabled: boolean;
  totalCodingTasks: string;
  setTotalCodingTasks: React.Dispatch<React.SetStateAction<string>>;
  enabledSections: string[];
  canUseUiPreview: boolean;
};

export function CreateTestStep1BasicInfoSection({
  step,
  isDark,
  testName,
  setTestName,
  basicInfoErrors,
  setBasicInfoErrors,
  position,
  setPosition,
  roleCategory,
  setRoleCategory,
  setEnabledSections,
  totalDuration,
  setTotalDuration,
  passPercentage,
  setPassPercentage,
  totalMcqs,
  setTotalMcqs,
  codingSectionEnabled,
  totalCodingTasks,
  setTotalCodingTasks,
  enabledSections,
  canUseUiPreview,
}: Props) {
  if (step !== 1) return null;

  const selectableSectionOptions = canUseUiPreview
    ? sectionOptions
    : sectionOptions.filter((section) => section.key !== "ui_preview");

  return (
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
              const nextRole = (value as CreateTestRole) || "developer";
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
          <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>
            Maximum 50 MCQs. Each MCQ carries 1 mark.
          </p>
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
            <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>
              Coding task marks are auto-distributed from the remaining marks out of 100.
            </p>
            {basicInfoErrors.totalCodingTasks ? <p className="mt-1 text-sm text-red-600">{basicInfoErrors.totalCodingTasks}</p> : null}
          </div>
        ) : null}
      </div>
      {roleCategory === "other" ? (
        <div className={`mt-4 rounded-[10px] border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-[#f8fafc]"}`}>
          <p className={`mb-3 text-sm font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Custom Sections (Other)</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {selectableSectionOptions.map((section) => {
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
                  className={`rounded-[8px] border px-3 py-2 text-left text-sm transition ${checked ? "border-[#1f3a8a] bg-[#eef2ff] text-[#1f3a8a]" : isDark ? "border-slate-600 bg-slate-800 text-slate-200" : "border-[#dbe3ef] bg-white text-[#475569]"}`}
                >
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </CreateTestCard>
  );
}
