"use client";

type AppSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDark?: boolean;
  className?: string;
  inputClassName?: string;
  showIcon?: boolean;
};

function SearchIcon({ isDark }: { isDark: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`size-4 ${isDark ? "text-slate-400" : "text-[#94a3b8]"}`}>
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function AppSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  isDark = false,
  className = "",
  inputClassName = "",
  showIcon = true,
}: AppSearchBarProps) {
  return (
    <label
      className={`flex items-center gap-2 rounded-[8px] border px-3 ${
        isDark
          ? "border-slate-600 bg-slate-800"
          : "border-[#dbe3ef] bg-[#f8fafc]"
      } ${className}`}
    >
      {showIcon ? <SearchIcon isDark={isDark} /> : null}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full bg-transparent outline-none ${
          isDark
            ? "text-slate-100 placeholder:text-slate-400"
            : "text-[#0f172a] placeholder:text-[#94a3b8]"
        } ${inputClassName}`}
      />
    </label>
  );
}

