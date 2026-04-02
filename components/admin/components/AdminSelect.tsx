"use client";

import { AppDropdown, type DropdownOption } from "@/components/shared/ui/AppDropdown";

type AdminSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  isDark: boolean;
  className?: string;
  triggerClassName?: string;
  ariaLabel?: string;
};

export function AdminSelect({
  value,
  onChange,
  options,
  isDark,
  className = "h-[52px]",
  triggerClassName = "px-3 text-base",
  ariaLabel = "Select option",
}: AdminSelectProps) {
  return (
    <AppDropdown
      value={value}
      onChange={onChange}
      options={options}
      ariaLabel={ariaLabel}
      className={`${className} rounded-[8px] border ${
        isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] bg-[#f8fafc] text-[#0f172a]"
      }`}
      triggerClassName={triggerClassName}
      chevronClassName={isDark ? "text-slate-300" : "text-[#94a3b8]"}
      menuClassName={`rounded-[8px] border shadow-lg ${
        isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef] bg-white"
      }`}
      optionClassName={`px-3 py-2 text-sm ${
        isDark ? "text-slate-200 hover:bg-slate-700" : "text-[#475569] hover:bg-[#f4f7ff]"
      }`}
      selectedOptionClassName={isDark ? "bg-slate-700 text-slate-100" : "bg-[#e9efff] text-[#1f3a8a]"}
    />
  );
}

