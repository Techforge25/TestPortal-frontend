"use client";

import { useMemo, useState } from "react";

type AuthTextFieldProps = {
  label: string;
  type?: string;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  showPasswordToggle?: boolean;
};

export function AuthTextField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  disabled = false,
  className = "",
  labelClassName = "",
  inputClassName = "",
  showPasswordToggle = false,
}: AuthTextFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = type === "password" && showPasswordToggle;
  const inputType = useMemo(() => {
    if (!isPasswordField) return type;
    return showPassword ? "text" : "password";
  }, [isPasswordField, showPassword, type]);

  return (
    <label className={`block ${className}`}>
      <span className={`mb-2 block text-lg font-medium text-slate-800 ${labelClassName}`}>{label}</span>
      <div className="relative">
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          className={`h-12 w-full rounded-lg border border-slate-200 px-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1f3a8a] ${
            isPasswordField ? "pr-11" : ""
          } ${inputClassName}`}
        />
        {isPasswordField ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#1f3a8a]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" className="size-5">
                <path d="M3 3L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M10.6 10.8C10.2 11.2 10 11.6 10 12C10 13.1 10.9 14 12 14C12.4 14 12.8 13.8 13.2 13.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M17.7 17.9C16 19 14.1 19.6 12 19.6C5.6 19.6 2.1 13.6 1.2 12C1.7 11.1 3 9 5.2 7.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8.8 4.7C9.8 4.4 10.9 4.2 12 4.2C18.4 4.2 21.9 10.2 22.8 11.8C22.4 12.6 21.5 14.2 20 15.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="size-5">
                <path d="M12 9.5C10.6 9.5 9.5 10.6 9.5 12C9.5 13.4 10.6 14.5 12 14.5C13.4 14.5 14.5 13.4 14.5 12C14.5 10.6 13.4 9.5 12 9.5Z" stroke="currentColor" strokeWidth="1.8" />
                <path d="M2 12C3 10.1 6.2 5.5 12 5.5C17.8 5.5 21 10.1 22 12C21 13.9 17.8 18.5 12 18.5C6.2 18.5 3 13.9 2 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ) : null}
      </div>
    </label>
  );
}
