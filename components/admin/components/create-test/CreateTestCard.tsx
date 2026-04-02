import type { ReactNode } from "react";

type CreateTestCardProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconContainerClassName?: string;
  children: ReactNode;
  bodyClassName?: string;
  isDark?: boolean;
};

export function CreateTestCard({
  title,
  subtitle,
  icon,
  iconContainerClassName = "bg-[#eef2ff] text-[#1f3a8a]",
  children,
  bodyClassName = "",
  isDark = false,
}: CreateTestCardProps) {
  return (
    <section className={`rounded-[12px] border ${isDark ? "border-slate-700 bg-slate-900" : "border-[#dbe3ef] bg-white"}`}>
      <div className={`border-b px-4 py-4 ${isDark ? "border-slate-700" : "border-[#e6ecf4]"}`}>
        <div className="flex items-center gap-3">
          {icon ? (
            <div className={`flex size-11 items-center justify-center rounded-[8px] ${iconContainerClassName}`}>{icon}</div>
          ) : null}
          <div>
            <h2 className={`text-[42px] font-semibold tracking-[-0.63px] [zoom:0.5] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{title}</h2>
            {subtitle ? <p className={`text-base ${isDark ? "text-slate-400" : "text-[#667085]"}`}>{subtitle}</p> : null}
          </div>
        </div>
      </div>
      <div className={`space-y-4 p-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
