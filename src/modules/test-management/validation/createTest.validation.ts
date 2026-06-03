import type { BasicInfoErrors } from "../types/createTest.types";

export function validateBasicInfoStep(input: {
  testName: string;
  position: string;
  totalDuration: string;
  passPercentage: string;
  totalMcqs: string;
  codingSectionEnabled: boolean;
  totalCodingTasks: string;
}): BasicInfoErrors {
  const errors: BasicInfoErrors = {};
  if (!input.testName.trim()) errors.testName = "Test name is required";
  if (!input.position.trim()) errors.position = "Position is required";
  if (!input.totalDuration.trim()) errors.totalDuration = "Duration is required";
  if (!input.passPercentage.trim()) errors.passPercentage = "Pass percentage is required";
  if (!input.totalMcqs.trim()) errors.totalMcqs = "Total MCQs is required";
  if (input.codingSectionEnabled && !input.totalCodingTasks.trim()) {
    errors.totalCodingTasks = "Total coding tasks is required";
  }
  return errors;
}
