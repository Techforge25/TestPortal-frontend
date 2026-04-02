"use client";

import { useEffect, useRef, useState } from "react";

type DropdownOption = {
  value: string;
  label: string;
};

type AppDropdownProps = {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  selectedOptionClassName?: string;
  chevronClassName?: string;
  ariaLabel?: string;
};

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppDropdown({
  options,
  value,
  onChange,
  className = "",
  triggerClassName = "",
  menuClassName = "",
  optionClassName = "",
  selectedOptionClassName = "",
  chevronClassName = "",
  ariaLabel = "Dropdown",
}: AppDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selected = options.find((option) => option.value === value);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-full w-full items-center justify-between ${triggerClassName}`}
      >
        <span>{selected?.label ?? value}</span>
        <span className={`transition-transform ${open ? "rotate-180" : ""} ${chevronClassName}`}>
          <ChevronDownIcon />
        </span>
      </button>

      {open ? (
        <div className={`absolute left-0 top-[calc(100%+8px)] z-20 w-full py-1 ${menuClassName}`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center text-left ${optionClassName} ${
                option.value === value ? selectedOptionClassName : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export type { DropdownOption };
