import { useState } from "react";
import type { CreateTestStep } from "../components/CreateTestStepper";
import {
  getNextStep,
  getPreviousStep,
} from "../constants/createTest.stepper";

export function useCreateTestWizard(initialStep: CreateTestStep = 1) {
  const [step, setStep] = useState<CreateTestStep>(initialStep);

  return {
    step,
    setStep,
    goNext: () => setStep((current) => getNextStep(current)),
    goPrevious: () => setStep((current) => getPreviousStep(current)),
  };
}
