import { ReactNode } from "react";

type AppButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "dangerDark";

type AppButtonSize = "sm" | "md" | "lg";

type AppButtonProps = {
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
};

const variantClassMap: Record<AppButtonVariant, string> = {
  primary:
    "bg-[#1f3a8a] text-white hover:bg-[#162f74] active:bg-[#122860] focus-visible:ring-[#1f3a8a]/40",
  secondary:
    "bg-[#f2f5ff] text-[#1f3a8a] hover:bg-[#e8edff] active:bg-[#dbe4ff] focus-visible:ring-[#1f3a8a]/30",
  outline:
    "border border-[#1f3a8a] bg-transparent text-[#1f3a8a] hover:bg-[#1f3a8a] hover:text-white active:bg-[#162f74] focus-visible:ring-[#1f3a8a]/30",
  ghost:
    "bg-transparent text-[#475569] hover:bg-slate-100 hover:text-[#1f3a8a] active:bg-slate-200 focus-visible:ring-slate-300",
  danger:
    "bg-[#ef2228] text-white hover:bg-[#dc1b21] active:bg-[#c5151b] focus-visible:ring-[#ef2228]/35",
  dangerDark:
    "bg-[#c9151d] text-white hover:bg-[#b01118] active:bg-[#990d14] focus-visible:ring-[#c9151d]/35",
};

const sizeClassMap: Record<AppButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-base",
  lg: "h-[52px] px-4 text-[18px]",
};

export function AppButton({
  children,
  leftIcon,
  rightIcon,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  onClick,
  disabled = false,
}: AppButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-[8px] font-medium leading-none shadow-sm transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantClassMap[variant]} ${sizeClassMap[size]} ${className}`}
    >
      {leftIcon ? <span className="inline-flex shrink-0 items-center">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span className="inline-flex shrink-0 items-center">{rightIcon}</span> : null}
    </button>
  );
}
