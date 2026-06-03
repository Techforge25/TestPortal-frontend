export type CreateTestRole =
  | "developer"
  | "frontend"
  | "designer"
  | "video_editor"
  | "qa_manual"
  | "hr"
  | "sales"
  | "other";

export type CreateTestSectionKey =
  | "mcq"
  | "coding"
  | "ui_preview"
  | "short_answer"
  | "long_answer"
  | "scenario"
  | "portfolio_link"
  | "bug_report"
  | "test_case";

export type NonCodingSectionKey = Exclude<CreateTestSectionKey, "mcq" | "coding">;

export type BasicInfoErrors = {
  testName?: string;
  position?: string;
  totalDuration?: string;
  passPercentage?: string;
  totalMcqs?: string;
  totalCodingTasks?: string;
};

export type RoleOption = { value: CreateTestRole; label: string };
export type SectionOption = { key: CreateTestSectionKey; label: string };

export type CreateTestMcqQuestion = {
  id: number;
  prompt: string;
  options: string[];
  selectedIndex: number;
  marks: string;
};

export type CreateTestCodingTask = {
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

export type CreateTestSecuritySettings = {
  forceFullscreen: boolean;
  disableTabSwitch: boolean;
  autoEndOnTabChange: boolean;
  disableCopyPaste: boolean;
  disableRightClick: boolean;
  devToolsDetection: boolean;
};

export type CreateTestPublishStatus = "draft" | "active";
