import type { SaveAdminTestPayload } from "@/src/services/api";
import type {
  CreateTestCodingTask,
  CreateTestMcqQuestion,
  CreateTestRole,
  CreateTestSecuritySettings,
} from "../types/createTest.types";
import {
  distributeIntegerMarks,
  getCodingMarksPool,
} from "../utils/createTestMarks";

export { normalizePublishStatus } from "./createTest.transform";

type SectionConfigsPayload = NonNullable<SaveAdminTestPayload["sectionConfigs"]>;

export type BuildCreateTestPayloadInput = {
  editingTestId?: string | number;
  testName: string;
  position: string;
  totalDuration: string;
  passPercentage: string;
  roleCategory: CreateTestRole;
  enabledSections: string[];
  sectionConfigs: SectionConfigsPayload;
  publishStatus: "draft" | "active";
  warningLimit: string;
  autoSaveInterval: string;
  securitySettings: CreateTestSecuritySettings;
  mcqQuestions: CreateTestMcqQuestion[];
  codingSectionEnabled: boolean;
  codingTasks: CreateTestCodingTask[];
};

export function buildCreateTestSavePayload(
  input: BuildCreateTestPayloadInput
): SaveAdminTestPayload {
  const duration = Number.parseInt(input.totalDuration, 10);
  const normalizedMcqQuestions = input.mcqQuestions.map((item) => ({
    prompt: item.prompt.trim() || "Question",
    options: item.options.map((option) => option.trim() || "Option"),
    selectedIndex: item.selectedIndex,
    marks: 1,
  }));
  const codingMarksDistribution = input.codingSectionEnabled
    ? distributeIntegerMarks(
        getCodingMarksPool(normalizedMcqQuestions.length),
        input.codingTasks.length
      )
    : [];

  return {
    id: input.editingTestId,
    testName: input.testName.trim() || "Untitled Test",
    position: input.position.trim() || "Not Specified",
    duration: Number.isFinite(duration) && duration > 0 ? duration : 60,
    passPercentage: Number.parseInt(input.passPercentage, 10) || 0,
    roleCategory: input.roleCategory,
    enabledSections: input.enabledSections,
    sectionConfigs: input.sectionConfigs,
    status: input.publishStatus,
    warningLimit: Number.parseInt(input.warningLimit, 10) || 2,
    autoSaveIntervalSeconds: Number.parseInt(input.autoSaveInterval, 10) || 60,
    securityFlags: {
      forceFullscreen: input.securitySettings.forceFullscreen,
      disableTabSwitch: input.securitySettings.disableTabSwitch,
      autoEndOnTabChange: input.securitySettings.autoEndOnTabChange,
      disableCopyPaste: input.securitySettings.disableCopyPaste,
      disableRightClick: input.securitySettings.disableRightClick,
      devToolsDetection: input.securitySettings.devToolsDetection,
    },
    mcqQuestions: normalizedMcqQuestions,
    codingTasks: input.codingSectionEnabled
      ? input.codingTasks.map((item, index) => ({
          taskName: item.taskName.trim() || "Task",
          description: item.description.trim() || "Task description",
          language: item.language,
          marks: codingMarksDistribution[index] ?? 0,
          sampleInput:
            item.testCases.find((testCase) => !testCase.isHidden)?.input ||
            item.testCases[0]?.input ||
            "",
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
  };
}
