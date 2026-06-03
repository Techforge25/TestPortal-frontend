import type { CreateTestStep } from "../components/CreateTestStepper";
import type { CreateTestRole } from "../types/createTest.types";

export type StepperMeta = {
  includeCodingStep: boolean;
  stepThreeLabel: string;
  useFrontendCustomSteps: boolean;
};

export function getStepperMeta(role: CreateTestRole, codingSectionEnabled: boolean): StepperMeta {
  const isFrontend = role === "frontend";
  const isQaManual = role === "qa_manual";

  return {
    includeCodingStep: !isFrontend,
    stepThreeLabel: codingSectionEnabled ? "Coding Tasks" : isQaManual ? "Bug Report" : "Assessment Sections",
    useFrontendCustomSteps: isFrontend,
  };
}

export function getNextStep(step: CreateTestStep): CreateTestStep {
  return (step === 6 ? 6 : step + 1) as CreateTestStep;
}

export function getPreviousStep(step: CreateTestStep): CreateTestStep {
  return (step === 1 ? 1 : step - 1) as CreateTestStep;
}
