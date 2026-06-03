// @ts-nocheck
import { CreateTestCard } from "../components/CreateTestCard";

export function StepRoleConfigDesigner(props: any) {
  const { step, isDark, sectionPrompts, parseDesignerUiTaskPrompt, upsertSectionPrompt, applyDesignerUiTaskPdf, readDesignerUiTaskError } = props;
  if (step !== 3) return null;
  const item = (sectionPrompts.portfolio_link || [])[0];
  if (!item) return null;
  const parsed = parseDesignerUiTaskPrompt(item.value || "");

  return (
    <CreateTestCard title="UI Task" subtitle="1 Section Enabled" isDark={isDark}>
      <div className="w-full space-y-2 rounded-[10px] border border-[#dbe3ef] p-3">
        <textarea value={parsed.taskPrompt} onChange={(event) => upsertSectionPrompt("portfolio_link", item.id, JSON.stringify({ ...parsed, taskPrompt: event.target.value }))} className={`h-[96px] w-full resize-none rounded-[8px] border px-3 py-3 text-[16px] outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] bg-white text-[#0f172a]"}`} placeholder="Design task prompt" />
        <input value={parsed.figmaReferenceLink} onChange={(event) => upsertSectionPrompt("portfolio_link", item.id, JSON.stringify({ ...parsed, figmaReferenceLink: event.target.value }))} className={`h-[48px] w-full rounded-[8px] border px-3 text-[15px] outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] bg-white text-[#0f172a]"}`} placeholder="Figma reference link" />
        <label htmlFor="designer-pdf-upload" className="inline-flex cursor-pointer items-center rounded-[8px] border border-[#1f3a8a] px-3 py-2 text-sm font-medium text-[#1f3a8a]">Upload Requirement PDF</label>
        <input id="designer-pdf-upload" type="file" accept="application/pdf" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; void applyDesignerUiTaskPdf("portfolio_link", item.id, file, parsed); event.currentTarget.value = ""; }} />
        <span className={`text-xs ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>{parsed.pdfFileName || "No PDF selected"}</span>
        {readDesignerUiTaskError("portfolio_link", item.id) ? <p className="text-xs text-red-600">{readDesignerUiTaskError("portfolio_link", item.id)}</p> : null}
      </div>
    </CreateTestCard>
  );
}
