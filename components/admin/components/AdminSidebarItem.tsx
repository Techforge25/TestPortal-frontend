import { ReactNode } from "react";
import Link from "next/link";

type AdminSidebarItemProps = {
  label: string;
  icon: ReactNode;
  active?: boolean;
  isDark?: boolean;
  href?: string;
};

export function AdminSidebarItem({
  label,
  icon,
  active = false,
  isDark = false,
  href,
}: AdminSidebarItemProps) {
  const classes = `flex h-11 w-full items-center justify-between rounded-[8px] px-4 transition ${
    active
      ? "bg-[#1F3A8A] text-white"
      : isDark
        ? "bg-slate-900 text-slate-200 hover:bg-[#1F3A8A] hover:text-white"
        : "bg-[#f9fafb] text-[#1f2437] hover:bg-[#1F3A8A] hover:text-white"
  }`;

  const content = (
    <>
      <span className="flex items-center gap-2.5">
        <span className="size-6">{icon}</span>
        <span className="text-base leading-5">{label}</span>
      </span>
      <svg
        className="size-5"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.5 5L12.5 10L7.5 15"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );

  if (href) {
    return (
      <Link href={href} prefetch className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes}>
      {content}
    </button>
  );
}
