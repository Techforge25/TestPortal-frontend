type CreateTestSummaryFieldProps = {
  label: string;
  value: string;
  isDark?: boolean;
};

export function CreateTestSummaryField({ label, value, isDark = false }: CreateTestSummaryFieldProps) {
  return (
    <div className={`rounded-[8px] border px-3 py-2.5 ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef] bg-[#f8fafc]"}`}>
      <p className={`text-base ${isDark ? "text-slate-300" : "text-[#667085]"}`}>{label}</p>
      <p className={`mt-1 text-[28px] font-medium tracking-[-0.42px] [zoom:0.5] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{value}</p>
    </div>
  );
}
