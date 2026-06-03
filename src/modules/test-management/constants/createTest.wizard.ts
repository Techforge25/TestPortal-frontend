import type {
  CreateTestRole,
  CreateTestSectionKey,
  NonCodingSectionKey,
  RoleOption,
  SectionOption,
} from "../types/createTest.types";

export const roleOptions: RoleOption[] = [
  { value: "developer", label: "Developer" },
  { value: "frontend", label: "Frontend" },
  { value: "designer", label: "Designer" },
  { value: "video_editor", label: "Video Editor" },
  { value: "qa_manual", label: "QA Manual" },
  { value: "hr", label: "HR" },
  { value: "sales", label: "Sales" },
  { value: "other", label: "Other" },
];

export const sectionOptions: SectionOption[] = [
  { key: "mcq", label: "MCQs" },
  { key: "coding", label: "Coding" },
  { key: "ui_preview", label: "UI Preview Task" },
  { key: "short_answer", label: "Short Answer" },
  { key: "long_answer", label: "Long Answer" },
  { key: "scenario", label: "Scenario" },
  { key: "portfolio_link", label: "Portfolio / Assignment" },
  { key: "bug_report", label: "Bug Report" },
  { key: "test_case", label: "Test Case" },
];

export const rolePresetSections: Record<CreateTestRole, CreateTestSectionKey[]> = {
  developer: ["mcq", "coding"],
  frontend: ["mcq", "ui_preview"],
  designer: ["mcq", "portfolio_link"],
  video_editor: ["mcq", "scenario", "short_answer", "long_answer"],
  qa_manual: ["mcq", "bug_report"],
  hr: ["mcq", "scenario", "long_answer"],
  sales: ["mcq", "scenario", "long_answer"],
  other: ["mcq"],
};

export const nonCodingSectionKeys: NonCodingSectionKey[] = [
  "ui_preview",
  "scenario",
  "portfolio_link",
  "short_answer",
  "long_answer",
  "bug_report",
  "test_case",
];

export const sectionDefaultPrompt: Record<NonCodingSectionKey, string> = {
  ui_preview:
    "Recreate the reference screen in code. Add screenshot/link in prompt and evaluate visual match, responsiveness, and clean UI structure.",
  scenario: "Write a real-world scenario question for the candidate.",
  portfolio_link:
    "Read the PDF requirement document and open the Figma reference link. Build your design based on those requirements.",
  short_answer: "Write a short answer question.",
  long_answer: "Write a long answer question.",
  bug_report: "",
  test_case: "Write a test case design question.",
};
