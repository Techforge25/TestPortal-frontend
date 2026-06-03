// @ts-nocheck
import Image from "next/image";
import { AppButton } from "@/components/shared/ui/AppButton";
import { CreateTestCard } from "../components/CreateTestCard";

export function StepRoleConfigFrontend(props: any) {
  const {
    step,
    isDark,
    sectionPrompts,
    parseUiPreviewPrompt,
    buildUiPreviewPrompt,
    upsertSectionPrompt,
    applyUiPreviewFile,
    readUiPreviewError,
    uiPreviewUploading,
    upsertSectionMarks,
    deleteSectionPrompt,
    TrashIcon,
  } = props;

  if (step !== 3) return null;
  const items = sectionPrompts.ui_preview || [];

  return (
    <CreateTestCard title="UI Preview Task" subtitle="1 Section Enabled" isDark={isDark}>
      <div className="space-y-4">
        {items.map((item: any) => {
          const parsed = parseUiPreviewPrompt(item.value || "");
          return (
            <article key={`ui_preview-${item.id}`} className={`rounded-[10px] border p-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0]"}`}>
              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-[8px] border px-3 py-1 text-[30px] font-semibold [zoom:0.5] ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#3254a3] bg-[#f3f4f6] text-[#1f3a8a]"}`}>UI Preview Task</span>
                <AppButton variant="secondary" size="sm" onClick={() => {}}>Configured</AppButton>
              </div>
              <div className="w-full space-y-2 rounded-[10px] border border-[#dbe3ef] p-3">
                <textarea value={parsed.taskPrompt} onChange={(event) => upsertSectionPrompt("ui_preview", item.id, buildUiPreviewPrompt({ ...parsed, taskPrompt: event.target.value }))} className={`h-[96px] w-full resize-none rounded-[8px] border px-3 py-3 text-[16px] outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] bg-white text-[#0f172a]"}`} placeholder="Recreate the provided UI screen in code." />
                <input value={parsed.referenceImageUrl} onChange={(event) => upsertSectionPrompt("ui_preview", item.id, buildUiPreviewPrompt({ ...parsed, referenceImageUrl: event.target.value }))} className={`h-[48px] w-full rounded-[8px] border px-3 text-[15px] outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] bg-white text-[#0f172a]"}`} placeholder="Reference image URL (https://...)" />
                <div className={`rounded-[10px] border border-dashed p-3 ${isDark ? "border-slate-600 bg-slate-800/40" : "border-[#cbd5e1] bg-[#f8fafc]"}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const droppedFile = event.dataTransfer.files?.[0]; if (!droppedFile) return; applyUiPreviewFile("ui_preview", item.id, droppedFile, parsed); }}>
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className={`text-xs ${isDark ? "text-slate-300" : "text-[#475569]"}`}>Drag & drop screenshot here</p><span className={`text-xs ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>PNG/JPG/WebP up to 1.5MB</span></div>
                  <div className="mt-2 flex items-center justify-between"><label htmlFor={`ui-preview-upload-${item.id}`} className="inline-flex cursor-pointer items-center rounded-[8px] border border-[#1f3a8a] px-3 py-2 text-sm font-medium text-[#1f3a8a]">Upload Screenshot</label><input id={`ui-preview-upload-${item.id}`} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; applyUiPreviewFile("ui_preview", item.id, file, parsed); event.currentTarget.value = ""; }} /><span className={`text-xs ${isDark ? "text-slate-400" : "text-[#64748b]"}`}>or click to upload</span></div>
                </div>
                {readUiPreviewError("ui_preview", item.id) ? <p className="text-xs text-red-600">{readUiPreviewError("ui_preview", item.id)}</p> : null}
                {uiPreviewUploading[`ui_preview-${item.id}`] ? <p className={`text-xs ${isDark ? "text-slate-300" : "text-[#1f3a8a]"}`}>Uploading screenshot...</p> : null}
                {parsed.referenceImageUrl ? <Image src={parsed.referenceImageUrl} alt="UI task reference" className="max-h-[220px] w-full rounded-[8px] border border-[#dbe3ef] object-contain" width={1200} height={700} unoptimized /> : null}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-[30px] [zoom:0.5] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>Marks:</span>
                <input type="number" min="1" value={item.marks || "10"} onChange={(event) => upsertSectionMarks("ui_preview", item.id, event.target.value)} className={`h-9 w-[96px] rounded-[8px] border px-2 outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] text-[#0f172a]"}`} />
              </div>
              <button type="button" onClick={() => deleteSectionPrompt("ui_preview", item.id)} className="mt-2"><TrashIcon /></button>
            </article>
          );
        })}
      </div>
    </CreateTestCard>
  );
}
