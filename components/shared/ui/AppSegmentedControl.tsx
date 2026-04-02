type SegmentedOption = {
  value: string;
  label: string;
};

type AppSegmentedControlProps = {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  buttonClassName?: string;
  activeButtonClassName?: string;
  inactiveButtonClassName?: string;
};

export function AppSegmentedControl({
  options,
  value,
  onChange,
  className = "",
  buttonClassName = "",
  activeButtonClassName = "bg-white text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.08)]",
  inactiveButtonClassName = "text-[#64748b] hover:bg-white/60 hover:text-[#0f172a]",
}: AppSegmentedControlProps) {
  return (
    <div className={`inline-flex items-center rounded-[10px] bg-[#f3f4f6] p-1 ${className}`}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-[8px] transition ${buttonClassName} ${
              isActive ? activeButtonClassName : inactiveButtonClassName
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export type { SegmentedOption };
