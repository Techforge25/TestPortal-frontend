import { AppButton } from "@/components/shared/ui/AppButton";

function SaveIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4">
      <path d="M4.5 4.5H15.5V15.5H4.5V4.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 4.5V8H13V4.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4">
      <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type CreateTestActionButtonsProps = {
  showPrevious?: boolean;
  showNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  nextLabel?: string;
};

export function CreateTestActionButtons({
  showPrevious = false,
  showNext = true,
  onPrevious,
  onNext,
  nextLabel = "Save & Next",
}: CreateTestActionButtonsProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        {showPrevious ? (
          <AppButton variant="outline" size="md" onClick={onPrevious} leftIcon={<ArrowLeft />}>
            Previous
          </AppButton>
        ) : null}
      </div>
      <div>
        {showNext ? (
          <AppButton variant="primary" size="md" onClick={onNext} leftIcon={<SaveIcon />}>
            {nextLabel}
          </AppButton>
        ) : null}
      </div>
    </div>
  );
}
