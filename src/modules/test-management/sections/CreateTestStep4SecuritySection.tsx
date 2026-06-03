import { CreateTestCard } from "../components/CreateTestCard";
import { CreateTestToggle } from "../components/CreateTestToggle";
import { AppDropdown } from "@/components/shared/ui/AppDropdown";
import type { ComponentType, Dispatch, SetStateAction } from "react";
import type { CreateTestSecuritySettings } from "../types/createTest.types";

type CreateTestStep4SecuritySectionProps = {
  step: number;
  isDark: boolean;
  SecurityIcon: ComponentType;
  securitySettings: CreateTestSecuritySettings;
  setSecuritySettings: Dispatch<SetStateAction<CreateTestSecuritySettings>>;
  warningLimit: string;
  setWarningLimit: (value: string) => void;
  autoSaveInterval: string;
  setAutoSaveInterval: (value: string) => void;
};

export function CreateTestStep4SecuritySection(props: CreateTestStep4SecuritySectionProps) {
  const { step, isDark, SecurityIcon, securitySettings, setSecuritySettings, warningLimit, setWarningLimit, autoSaveInterval, setAutoSaveInterval } = props;
  if (step !== 4) return null;

  return (
    <CreateTestCard
      title="Security Configuration"
      subtitle="Configure Proctoring And Security Settings"
      icon={<SecurityIcon />}
      iconContainerClassName="bg-[#eff6ff] text-[#1f3a8a]"
      isDark={isDark}
    >
      <div className={`space-y-2 rounded-[10px] border p-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0]"}`}>
        <CreateTestToggle title="Force Fullscreen" subtitle="Require Fullscreen Mode Throughout The Test" checked={securitySettings.forceFullscreen} onChange={(checked) => setSecuritySettings((prev) => ({ ...prev, forceFullscreen: checked }))} isDark={isDark} />
        <CreateTestToggle title="Disable Tab Switch" subtitle="Detect And Warn On Tab Changes" checked={securitySettings.disableTabSwitch} onChange={(checked) => setSecuritySettings((prev) => ({ ...prev, disableTabSwitch: checked }))} isDark={isDark} />
        <CreateTestToggle title="Auto End on Tab Change" subtitle="Automatically Submit Test On Tab Switch" checked={securitySettings.autoEndOnTabChange} onChange={(checked) => setSecuritySettings((prev) => ({ ...prev, autoEndOnTabChange: checked }))} isDark={isDark} />
        <CreateTestToggle title="Disable Copy/Paste" subtitle="Block Clipboard Operations" checked={securitySettings.disableCopyPaste} onChange={(checked) => setSecuritySettings((prev) => ({ ...prev, disableCopyPaste: checked }))} isDark={isDark} />
        <CreateTestToggle title="Disable Right Click" subtitle="Prevent Context Menu" checked={securitySettings.disableRightClick} onChange={(checked) => setSecuritySettings((prev) => ({ ...prev, disableRightClick: checked }))} isDark={isDark} />
        <CreateTestToggle title="DevTools Detection" subtitle="Detect Browser Developer Tools" checked={securitySettings.devToolsDetection} onChange={(checked) => setSecuritySettings((prev) => ({ ...prev, devToolsDetection: checked }))} isDark={isDark} />

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className={`text-base font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Warning Limit</p>
            <AppDropdown value={warningLimit} onChange={setWarningLimit} options={[{ value: "1", label: "1 Warning" }, { value: "2", label: "2 Warnings" }, { value: "3", label: "3 Warnings" }, { value: "4", label: "4 Warnings" }]} ariaLabel="Warning limit" className={`h-[52px] rounded-[8px] border ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef] bg-white"}`} triggerClassName={`px-3 text-[16px] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`} chevronClassName={isDark ? "text-slate-400" : "text-[#98a2b3]"} menuClassName={`rounded-[10px] border shadow-lg ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef] bg-white"}`} optionClassName={`px-3 py-2 text-[15px] ${isDark ? "text-slate-200 hover:bg-slate-700" : "text-[#475569] hover:bg-[#f4f7ff]"}`} selectedOptionClassName="bg-[#e9efff] text-[#1f3a8a]" />
          </div>
          <div className="space-y-2">
            <p className={`text-base font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>Auto Save Interval</p>
            <AppDropdown value={autoSaveInterval} onChange={setAutoSaveInterval} options={[{ value: "30", label: "Every 30 seconds" }, { value: "60", label: "Every 60 seconds" }, { value: "120", label: "Every 120 seconds" }, { value: "300", label: "Every 5 minutes" }]} ariaLabel="Auto save interval" className={`h-[52px] rounded-[8px] border ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef] bg-white"}`} triggerClassName={`px-3 text-[16px] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`} chevronClassName={isDark ? "text-slate-400" : "text-[#98a2b3]"} menuClassName={`rounded-[10px] border shadow-lg ${isDark ? "border-slate-600 bg-slate-800" : "border-[#dbe3ef] bg-white"}`} optionClassName={`px-3 py-2 text-[15px] ${isDark ? "text-slate-200 hover:bg-slate-700" : "text-[#475569] hover:bg-[#f4f7ff]"}`} selectedOptionClassName="bg-[#e9efff] text-[#1f3a8a]" />
          </div>
        </div>
      </div>
    </CreateTestCard>
  );
}
