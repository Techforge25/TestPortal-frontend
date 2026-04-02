import type { ReactNode } from "react";

export type AdminStatCardData = {
  label: string;
  value: string;
  trend: string;
  trendDown?: boolean;
  iconBg: string;
  icon: ReactNode;
};

type AdminStatCardProps = {
  card: AdminStatCardData;
  isDark: boolean;
};

export function AdminStatCard({ card, isDark }: AdminStatCardProps) {
  return (
    <article
      className={`rounded-xl border px-3 py-6 ${
        isDark ? "border-slate-700 bg-slate-800" : "border-[#e2e8f0] bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex size-[50px] items-center justify-center rounded-lg text-xl ${
            isDark ? "bg-slate-700 text-slate-200" : `${card.iconBg} text-[#1f3a8a]`
          }`}
        >
          {card.icon}
        </div>
        <p className={`text-base font-medium ${card.trendDown ? "text-red-600" : "text-emerald-600"}`}>
          {card.trend}
        </p>
      </div>
      <p className={`mt-2 text-4xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
        {card.value}
      </p>
      <p className={`mt-1 text-base ${isDark ? "text-slate-300" : "text-[#666c77]"}`}>{card.label}</p>
    </article>
  );
}
