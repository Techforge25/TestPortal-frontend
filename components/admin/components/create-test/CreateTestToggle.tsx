type CreateTestToggleProps = {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  isDark?: boolean;
};

export function CreateTestToggle({ title, subtitle, checked, onChange, disabled = false, isDark = false }: CreateTestToggleProps) {
  return (
    <div className="flex items-start gap-2">
      <button
        type="button"
        aria-pressed={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative mt-1 h-7 w-[58px] rounded-full border transition ${
          checked
            ? "border-[#16a34a] bg-[#16a34a]"
            : isDark
              ? "border-slate-500 bg-slate-800"
              : "border-[#b0b8c4] bg-white"
        } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <span
          className={`absolute top-1/2 size-5 -translate-y-1/2 rounded-full transition ${
            checked ? "right-1 bg-white" : isDark ? "left-1 bg-slate-300" : "left-1 bg-[#9ca3af]"
          }`}
        />
      </button>
      <div>
        <p className={`text-[32px] font-medium tracking-[-0.48px] [zoom:0.5] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{title}</p>
        <p className={`text-base ${isDark ? "text-slate-400" : "text-[#667085]"}`}>{subtitle}</p>
      </div>
    </div>
  );
}
