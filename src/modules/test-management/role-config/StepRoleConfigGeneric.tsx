import { AppButton } from "@/components/shared/ui/AppButton";
import { CreateTestCard } from "../components/CreateTestCard";
import type { ComponentType } from "react";
import type {
  NonCodingSectionKey,
} from "../types/createTest.types";
import type { SectionPromptItem } from "../utils/createTest.helpers";

export type StepRoleConfigGenericProps = {
  step: number;
  roleCategory?: string;
  isDark: boolean;
  enabledSections: string[];
  nonCodingSectionKeys: NonCodingSectionKey[];
  sectionPrompts: Record<NonCodingSectionKey, SectionPromptItem[]>;
  getSectionLabelForRole: (sectionKey: string) => string;
  addSectionPrompt: (section: NonCodingSectionKey) => void;
  upsertSectionPrompt: (section: NonCodingSectionKey, id: number, value: string) => void;
  sectionDefaultPrompt: Record<NonCodingSectionKey, string>;
  deleteSectionPrompt: (section: NonCodingSectionKey, id: number) => void;
  TrashIcon: ComponentType;
};

export function StepRoleConfigGeneric(props: StepRoleConfigGenericProps) {
  const { step, isDark, enabledSections, nonCodingSectionKeys, sectionPrompts, getSectionLabelForRole, addSectionPrompt, upsertSectionPrompt, sectionDefaultPrompt, deleteSectionPrompt, TrashIcon } = props;
  if (step !== 3) return null;

  const sections = (enabledSections || []).filter((section): section is NonCodingSectionKey =>
    nonCodingSectionKeys.includes(section as NonCodingSectionKey)
  );
  return (
    <CreateTestCard title="Assessment Sections" subtitle={`${sections.length} Sections Enabled`} isDark={isDark}>
      <div className="space-y-4">
        {sections.map((sectionKey) => {
          const items = sectionPrompts[sectionKey] || [];
          return (
            <article key={sectionKey} className={`rounded-[10px] border p-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0]"}`}>
              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-[8px] border px-3 py-1 text-[30px] font-semibold [zoom:0.5] ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#3254a3] bg-[#f3f4f6] text-[#1f3a8a]"}`}>{getSectionLabelForRole(sectionKey)}</span>
                <AppButton variant="secondary" size="sm" onClick={() => addSectionPrompt(sectionKey)}>Add</AppButton>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={`${sectionKey}-${item.id}`} className="flex items-start gap-2">
                    <textarea value={item.value} onChange={(event) => upsertSectionPrompt(sectionKey, item.id, event.target.value)} className={`h-[86px] w-full resize-none rounded-[8px] border px-3 py-3 text-[16px] outline-none ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-[#dbe3ef] bg-white text-[#0f172a]"}`} placeholder={sectionDefaultPrompt[sectionKey] || "Write prompt"} />
                    <button type="button" onClick={() => deleteSectionPrompt(sectionKey, item.id)} className="mt-2 shrink-0"><TrashIcon /></button>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </CreateTestCard>
  );
}
