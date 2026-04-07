type CreateTestStep = 1 | 2 | 3 | 4 | 5;

const baseSteps: { id: CreateTestStep; label: string }[] = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Add MCQs" },
  { id: 3, label: "Coding Tasks" },
  { id: 4, label: "Security" },
  { id: 5, label: "Publish" },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5">
      <path d="M4.5 10L8.2 13.6L15.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CreateTestStepper({
  currentStep,
  isDark = false,
  includeCodingStep = true,
  stepThreeLabel = "Coding Tasks",
}: {
  currentStep: CreateTestStep;
  isDark?: boolean;
  includeCodingStep?: boolean;
  stepThreeLabel?: string;
}) {
  const steps = baseSteps.map((step) =>
    step.id === 3 ? { ...step, label: stepThreeLabel } : step
  );
  const visibleSteps = includeCodingStep ? steps : steps.filter((step) => step.id !== 3);
  return (
    <div className="w-full">
      <div className="flex w-full items-start">
        {visibleSteps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isLast = index === visibleSteps.length - 1;

          return (
            <div key={step.id} className={`flex items-start ${isLast ? "" : "flex-1"}`}>
              <div className="flex w-[108px] flex-col items-center">
                <div
                  className={`flex h-[62px] w-[62px] items-center justify-center rounded-full border text-[22px] font-medium ${
                    isCompleted
                      ? "border-[#1f3a8a] bg-[#1f3a8a] text-white"
                      : isActive
                        ? "border-[#16a34a] bg-[#16a34a] text-white"
                        : isDark
                          ? "border-slate-600 bg-slate-800 text-slate-100"
                          : "border-[#dbe3ef] bg-white text-[#0f172a]"
                  }`}
                >
                  {isCompleted ? <CheckIcon /> : <span>{String(step.id).padStart(2, "0")}</span>}
                </div>
                <p className={`mt-2 text-center text-[18px] font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{step.label}</p>
              </div>
              {index < visibleSteps.length - 1 ? (
                <div
                  className={`mx-3 mt-[30px] h-1 flex-1 rounded-full ${
                    step.id < currentStep ? "bg-[#1f3a8a]" : isDark ? "bg-slate-700" : "bg-[#dbe3ef]"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { CreateTestStep };
