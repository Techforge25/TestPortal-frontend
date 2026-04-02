import type { ReactNode } from "react";

type CreateTestFieldProps = {
  label: string;
  value?: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "tel" | "number" | "date";
  rightAddon?: ReactNode;
  multiline?: boolean;
  inputHeight?: "default" | "large";
  required?: boolean;
  onChange?: (value: string) => void;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  isDark?: boolean;
};

export function CreateTestField({
  label,
  value,
  placeholder,
  type = "text",
  rightAddon,
  multiline = false,
  inputHeight = "default",
  required = false,
  onChange,
  containerClassName = "",
  labelClassName = "",
  inputClassName = "",
  isDark = false,
}: CreateTestFieldProps) {
  return (
    <label className={`space-y-2 ${containerClassName}`}>
      <span className={`block text-[34px] font-medium tracking-[-0.51px] [zoom:0.5] ${isDark ? "text-slate-100" : "text-[#0f172a]"} ${labelClassName}`}>
        {label}
        {required ? <span className="ml-1 text-[#dc2626]">*</span> : null}
      </span>
      {multiline ? (
        <textarea
          value={value}
          required={required}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          className={`h-20 w-full resize-none rounded-[8px] border px-3 py-2 text-[16px] outline-none placeholder:text-[#98a2b3] focus:border-[#1f3a8a] ${isDark ? "border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400" : "border-[#dbe3ef] text-[#0f172a]"} ${inputClassName}`}
        />
      ) : (
        <div className="relative">
          <input
            type={type}
            value={value}
            required={required}
            onChange={(event) => onChange?.(event.target.value)}
            placeholder={placeholder}
            className={`${inputHeight === "large" ? "h-[52px]" : "h-10"} w-full rounded-[8px] border px-3 pr-10 text-[16px] outline-none placeholder:text-[#98a2b3] focus:border-[#1f3a8a] ${isDark ? "border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400" : "border-[#dbe3ef] text-[#0f172a]"} ${inputClassName}`}
          />
          {rightAddon ? <span className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400" : "text-[#98a2b3]"}`}>{rightAddon}</span> : null}
        </div>
      )}
    </label>
  );
}
