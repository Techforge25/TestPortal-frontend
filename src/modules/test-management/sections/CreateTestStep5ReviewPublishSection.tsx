import { AppButton } from "@/components/shared/ui/AppButton";
import { AppSegmentedControl } from "@/components/shared/ui/AppSegmentedControl";
import { CreateTestCard } from "../components/CreateTestCard";
import { CreateTestSummaryField } from "../components/CreateTestSummaryField";
import type { ComponentType } from "react";
import type {
  CreateTestCodingTask,
  CreateTestMcqQuestion,
  CreateTestPublishStatus,
  CreateTestRole,
  RoleOption,
} from "../types/createTest.types";

type CreateTestStep5ReviewPublishSectionProps = {
  step: number;
  isDark: boolean;
  ReviewPublishIcon: ComponentType;
  testName: string;
  position: string;
  roleOptions: RoleOption[];
  roleCategory: CreateTestRole;
  totalDuration: string;
  passPercentage: string;
  totalMcqs: string;
  mcqQuestions: CreateTestMcqQuestion[];
  codingSectionEnabled: boolean;
  totalCodingTasks: string;
  codingTasks: CreateTestCodingTask[];
  isQaManualRole: boolean;
  enabledSections: string[];
  getSectionLabelForRole: (sectionKey: string) => string;
  publishStatus: CreateTestPublishStatus;
  setPublishStatus: (status: CreateTestPublishStatus) => void;
  PublishButtonIcon: ComponentType;
  handlePublishTest: () => void;
  isPublishing: boolean;
};

export function CreateTestStep5ReviewPublishSection(props: CreateTestStep5ReviewPublishSectionProps) {
  const { step, isDark, ReviewPublishIcon, testName, position, roleOptions, roleCategory, totalDuration, passPercentage, totalMcqs, mcqQuestions, codingSectionEnabled, totalCodingTasks, codingTasks, isQaManualRole, enabledSections, getSectionLabelForRole, publishStatus, setPublishStatus, PublishButtonIcon, handlePublishTest, isPublishing } = props;
  if (step !== 5) return null;

  return (
    <CreateTestCard title="Review & Publish" subtitle="Review Your Test Configuration Before Publishing" icon={<ReviewPublishIcon />} iconContainerClassName="bg-[#eff6ff] text-[#1f3a8a]" isDark={isDark}>
      <div className="grid gap-4 md:grid-cols-2">
        <CreateTestSummaryField label="Test Name" value={testName || "Front End Developer"} isDark={isDark} />
        <CreateTestSummaryField label="Position" value={position || "Frontend Developer"} isDark={isDark} />
        <CreateTestSummaryField label="Role" value={roleOptions.find((r) => r.value === roleCategory)?.label || "Developer"} isDark={isDark} />
        <CreateTestSummaryField label="Duration" value={`${totalDuration || "60"} minutes`} isDark={isDark} />
        <CreateTestSummaryField label="Pass Percentage" value={`${passPercentage || "70"}%`} isDark={isDark} />
        <CreateTestSummaryField label="MCQ Questions" value={`${totalMcqs || mcqQuestions.length} Questions`} isDark={isDark} />
        {codingSectionEnabled ? <CreateTestSummaryField label="Coding Tasks" value={`${totalCodingTasks || codingTasks.length} Tasks`} isDark={isDark} /> : null}
        {!codingSectionEnabled ? (
          <CreateTestSummaryField label={isQaManualRole ? "Bug Report Sections" : "Assessment Sections"} value={enabledSections.filter((section: string) => section !== "mcq").map((section: string) => getSectionLabelForRole(section)).join(", ") || "MCQs"} isDark={isDark} />
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-[32px] [zoom:0.5] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>Status:</span>
        <AppSegmentedControl options={[{ value: "draft", label: "Draft" }, { value: "active", label: "Active" }]} value={publishStatus} onChange={(value) => setPublishStatus(value as "draft" | "active")} buttonClassName="min-w-[102px] px-5 py-2" />
      </div>
      <AppButton variant="primary" size="lg" className="w-full" leftIcon={<PublishButtonIcon />} onClick={handlePublishTest} disabled={isPublishing}>
        {isPublishing ? "Publishing..." : "Publish Test"}
      </AppButton>
    </CreateTestCard>
  );
}
