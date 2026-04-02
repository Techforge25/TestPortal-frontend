"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { AdminFooter } from "@/components/admin/components/AdminFooter";
import { AdminSelect } from "@/components/admin/components/AdminSelect";
import { AdminSidebar } from "@/components/admin/components/AdminSidebar";
import { AdminTopHeader } from "@/components/admin/components/AdminTopHeader";
import { useAdminTheme } from "@/components/admin/hooks/useAdminTheme";
import { AppButton } from "@/components/shared/ui/AppButton";
import { CreateTestToggle } from "@/components/admin/components/create-test/CreateTestToggle";
import { getAdminToken } from "@/components/admin/lib/adminAuthStorage";
import {
  getAdminNotificationSettings,
  saveAdminNotificationSettings,
  getAdminSecurityDefaults,
  saveAdminSecurityDefaults,
} from "@/components/admin/lib/backendApi";

const ADMIN_SECURITY_LOCAL_KEY = "admin_security_defaults_local_v1";
const ADMIN_NOTIFICATIONS_LOCAL_KEY = "admin_notifications_local_v1";

type LocalSecurityDefaults = {
  forceFullscreen: boolean;
  disableTabSwitch: boolean;
  autoEndOnTabChange: boolean;
  disableCopyPaste: boolean;
  disableRightClick: boolean;
  detectDevTools: boolean;
  warningLimit: number;
  autoSaveInterval: number;
};

type LocalNotificationSettings = {
  testCompleted: boolean;
  newCandidate: boolean;
  violationAlert: boolean;
};

function readLocalNotificationSettings(): LocalNotificationSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_NOTIFICATIONS_LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalNotificationSettings;
  } catch {
    return null;
  }
}

function writeLocalNotificationSettings(value: LocalNotificationSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADMIN_NOTIFICATIONS_LOCAL_KEY, JSON.stringify(value));
  } catch {
    // Ignore local cache write errors.
  }
}

function readLocalSecurityDefaults(): LocalSecurityDefaults | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_SECURITY_LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalSecurityDefaults;
  } catch {
    return null;
  }
}

function writeLocalSecurityDefaults(value: LocalSecurityDefaults) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADMIN_SECURITY_LOCAL_KEY, JSON.stringify(value));
  } catch {
    // Ignore local cache write errors.
  }
}

function SectionCard({ title, children, isDark }: { title: string; children: ReactNode; isDark: boolean }) {
  return (
    <section className={`rounded-[8px] border px-6 py-8 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
      <h2 className={`text-[22px] font-semibold tracking-[-0.33px] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

type AdminSettingsScreenProps = {
  initialThemeDark?: boolean;
};

export function AdminSettingsScreen({ initialThemeDark = false }: AdminSettingsScreenProps) {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const token = getAdminToken();
  const { isDark, toggleTheme } = useAdminTheme(initialThemeDark);
  const initialLocalSecurity = readLocalSecurityDefaults();
  const initialLocalNotifications = readLocalNotificationSettings();

  const [warningLimit, setWarningLimit] = useState(String(initialLocalSecurity?.warningLimit ?? 2));
  const [autoSaveInterval, setAutoSaveInterval] = useState(String(initialLocalSecurity?.autoSaveInterval ?? 60));
  const [notifyTestCompleted, setNotifyTestCompleted] = useState(initialLocalNotifications?.testCompleted ?? true);
  const [notifyNewCandidate, setNotifyNewCandidate] = useState(initialLocalNotifications?.newCandidate ?? true);
  const [notifyViolationAlert, setNotifyViolationAlert] = useState(initialLocalNotifications?.violationAlert ?? true);
  const [forceFullscreenDefault, setForceFullscreenDefault] = useState(initialLocalSecurity?.forceFullscreen ?? true);
  const [disableTabSwitchDefault, setDisableTabSwitchDefault] = useState(initialLocalSecurity?.disableTabSwitch ?? true);
  const [autoEndOnTabChangeDefault, setAutoEndOnTabChangeDefault] = useState(initialLocalSecurity?.autoEndOnTabChange ?? false);
  const [disableCopyPasteDefault, setDisableCopyPasteDefault] = useState(initialLocalSecurity?.disableCopyPaste ?? true);
  const [disableRightClickDefault, setDisableRightClickDefault] = useState(initialLocalSecurity?.disableRightClick ?? true);
  const [devToolsDetectionDefault, setDevToolsDetectionDefault] = useState(initialLocalSecurity?.detectDevTools ?? true);
  const [notificationsSaved, setNotificationsSaved] = useState("");
  const [notificationsError, setNotificationsError] = useState("");
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [securitySaved, setSecuritySaved] = useState("");

  function applyNotificationState(value: LocalNotificationSettings) {
    setNotifyTestCompleted(value.testCompleted);
    setNotifyNewCandidate(value.newCandidate);
    setNotifyViolationAlert(value.violationAlert);
  }

  function applySecurityState(value: LocalSecurityDefaults) {
    setForceFullscreenDefault(value.forceFullscreen);
    setDisableTabSwitchDefault(value.disableTabSwitch);
    setAutoEndOnTabChangeDefault(value.autoEndOnTabChange);
    setDisableCopyPasteDefault(value.disableCopyPaste);
    setDisableRightClickDefault(value.disableRightClick);
    setDevToolsDetectionDefault(value.detectDevTools);
    setWarningLimit(String(value.warningLimit));
    setAutoSaveInterval(String(value.autoSaveInterval));
  }

  const loadSettings = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const localNotifications = readLocalNotificationSettings();
      if (localNotifications) {
        applyNotificationState(localNotifications);
      }
      const localSecurity = readLocalSecurityDefaults();
      if (localSecurity) {
        applySecurityState(localSecurity);
      }

      const [notificationRes, securityRes] = await Promise.all([
        getAdminNotificationSettings(token),
        getAdminSecurityDefaults(token),
      ]);

      const mergedNotifications: LocalNotificationSettings = {
        testCompleted: Boolean(notificationRes.notifications?.testCompleted),
        newCandidate: Boolean(notificationRes.notifications?.newCandidate),
        violationAlert: Boolean(notificationRes.notifications?.violationAlert),
      };
      applyNotificationState(mergedNotifications);
      writeLocalNotificationSettings(mergedNotifications);

      const local = readLocalSecurityDefaults();
      const merged: LocalSecurityDefaults = {
        forceFullscreen:
          local?.forceFullscreen ??
          securityRes.securityDefaults?.forceFullscreen ??
          true,
        disableTabSwitch:
          local?.disableTabSwitch ??
          securityRes.securityDefaults?.disableTabSwitch ??
          true,
        autoEndOnTabChange:
          local?.autoEndOnTabChange ??
          securityRes.securityDefaults?.autoEndOnTabChange ??
          false,
        disableCopyPaste:
          local?.disableCopyPaste ??
          securityRes.securityDefaults?.disableCopyPaste ??
          true,
        disableRightClick:
          local?.disableRightClick ??
          securityRes.securityDefaults?.disableRightClick ??
          true,
        detectDevTools:
          local?.detectDevTools ??
          securityRes.securityDefaults?.detectDevTools ??
          true,
        warningLimit:
          local?.warningLimit ??
          securityRes.securityDefaults?.warningLimit ??
          2,
        autoSaveInterval:
          local?.autoSaveInterval ??
          securityRes.securityDefaults?.autoSaveInterval ??
          60,
      };
      applySecurityState(merged);
      writeLocalSecurityDefaults(merged);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load settings";
      setNotificationsError(message);
    }
  }, [token]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function handleSaveNotifications() {
    setNotificationsError("");
    if (!token) {
      setNotificationsError("Admin session not found. Please login again.");
      return;
    }
    setIsSavingNotifications(true);
    setNotificationsSaved("Notification settings saved.");
    const localPayload: LocalNotificationSettings = {
      testCompleted: notifyTestCompleted,
      newCandidate: notifyNewCandidate,
      violationAlert: notifyViolationAlert,
    };
    applyNotificationState(localPayload);
    writeLocalNotificationSettings(localPayload);
    window.setTimeout(() => setIsSavingNotifications(false), 120);
    void (async () => {
      try {
        const response = await saveAdminNotificationSettings(token, {
          testCompleted: notifyTestCompleted,
          newCandidate: notifyNewCandidate,
          violationAlert: notifyViolationAlert,
        });
        const mergedNotifications: LocalNotificationSettings = {
          testCompleted: Boolean(response.notifications?.testCompleted),
          newCandidate: Boolean(response.notifications?.newCandidate),
          violationAlert: Boolean(response.notifications?.violationAlert),
        };
        applyNotificationState(mergedNotifications);
        writeLocalNotificationSettings(mergedNotifications);
        setNotificationsSaved(response.message || "Notification settings saved.");
        window.setTimeout(() => setNotificationsSaved(""), 2000);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save notification settings";
        setNotificationsError(`${message}. Local settings are applied and will sync on next successful save.`);
      }
    })();
  }

  function handleSaveSecurityDefaults() {
    if (!token) {
      setNotificationsError("Admin session not found. Please login again.");
      return;
    }
    setIsSavingSecurity(true);
    setSecuritySaved("Security defaults saved.");
    setNotificationsError("");
    const localPayload: LocalSecurityDefaults = {
      forceFullscreen: forceFullscreenDefault,
      disableTabSwitch: disableTabSwitchDefault,
      autoEndOnTabChange: autoEndOnTabChangeDefault,
      disableCopyPaste: disableCopyPasteDefault,
      disableRightClick: disableRightClickDefault,
      detectDevTools: devToolsDetectionDefault,
      warningLimit: Number.parseInt(warningLimit, 10) || 2,
      autoSaveInterval: Number.parseInt(autoSaveInterval, 10) || 60,
    };
    applySecurityState(localPayload);
    writeLocalSecurityDefaults(localPayload);
    window.setTimeout(() => setIsSavingSecurity(false), 120);
    void (async () => {
      try {
        const response = await saveAdminSecurityDefaults(token, {
          forceFullscreen: localPayload.forceFullscreen,
          disableTabSwitch: localPayload.disableTabSwitch,
          autoEndOnTabChange: localPayload.autoEndOnTabChange,
          disableCopyPaste: localPayload.disableCopyPaste,
          disableRightClick: localPayload.disableRightClick,
          detectDevTools: localPayload.detectDevTools,
          warningLimit: localPayload.warningLimit,
          autoSaveInterval: localPayload.autoSaveInterval,
        });
        const merged: LocalSecurityDefaults = {
          forceFullscreen: response.securityDefaults?.forceFullscreen ?? localPayload.forceFullscreen,
          disableTabSwitch: response.securityDefaults?.disableTabSwitch ?? localPayload.disableTabSwitch,
          autoEndOnTabChange: response.securityDefaults?.autoEndOnTabChange ?? localPayload.autoEndOnTabChange,
          disableCopyPaste: response.securityDefaults?.disableCopyPaste ?? localPayload.disableCopyPaste,
          disableRightClick: response.securityDefaults?.disableRightClick ?? localPayload.disableRightClick,
          detectDevTools: response.securityDefaults?.detectDevTools ?? localPayload.detectDevTools,
          warningLimit: response.securityDefaults?.warningLimit ?? localPayload.warningLimit,
          autoSaveInterval: response.securityDefaults?.autoSaveInterval ?? localPayload.autoSaveInterval,
        };
        applySecurityState(merged);
        writeLocalSecurityDefaults(merged);
        setSecuritySaved(response.message || "Security defaults saved.");
        window.setTimeout(() => setSecuritySaved(""), 2000);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save security defaults";
        setNotificationsError(`${message}. Local defaults are applied and will sync on next successful save.`);
      }
    })();
  }

  if (!isHydrated) {
    return (
      <main className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-[#f8fafc]"}`} />
    );
  }

  return (
    <main className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-[#f8fafc]"}`}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar isDark={isDark} activeItem="settings" />

        <section className="flex w-full flex-col">
          <AdminTopHeader isDark={isDark} onToggleTheme={toggleTheme} currentPage="Settings" />

          <div className="flex-1 space-y-8 px-8 pb-10 pt-6">
            {/*
              Branding and Profile sections are intentionally disabled in static frontend mode.
              Keeping this block commented to restore quickly if needed.
            */}

            <SectionCard title="Email Notifications" isDark={isDark}>
              <div className="space-y-6">
                <CreateTestToggle
                  title="Test Completed"
                  subtitle="Receive Email When A Candidate Completes A Test"
                  checked={notifyTestCompleted}
                  onChange={setNotifyTestCompleted}
                  isDark={isDark}
                />
                <CreateTestToggle
                  title="New Candidate"
                  subtitle="Receive Email When A New Candidate Registers"
                  checked={notifyNewCandidate}
                  onChange={setNotifyNewCandidate}
                  isDark={isDark}
                />
                <CreateTestToggle
                  title="Violation Alert"
                  subtitle="Receive Email For High-Severity Violations"
                  checked={notifyViolationAlert}
                  onChange={setNotifyViolationAlert}
                  isDark={isDark}
                />
                <div className="flex items-center justify-end gap-3">
                  {notificationsError ? <p className="text-sm text-red-600">{notificationsError}</p> : null}
                  {notificationsSaved ? <p className="text-sm text-emerald-600">{notificationsSaved}</p> : null}
                  <AppButton variant="primary" size="md" onClick={handleSaveNotifications} disabled={isSavingNotifications}>
                    {isSavingNotifications ? "Saving..." : "Save Notifications"}
                  </AppButton>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Security Defaults" isDark={isDark}>
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className={`text-[18px] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>Default Warning Limit</p>
                    <AdminSelect
                      value={warningLimit}
                      onChange={setWarningLimit}
                      options={[
                        { value: "1", label: "1 Warning" },
                        { value: "2", label: "2 Warnings" },
                        { value: "3", label: "3 Warnings" },
                        { value: "4", label: "4 Warnings" },
                      ]}
                      isDark={isDark}
                      className="h-[52px]"
                      triggerClassName="px-3 text-[18px] font-medium"
                    />
                  </div>

                  <div className="space-y-3">
                    <p className={`text-[18px] ${isDark ? "text-slate-300" : "text-[#475569]"}`}>Auto Save Interval</p>
                    <AdminSelect
                      value={autoSaveInterval}
                      onChange={setAutoSaveInterval}
                      options={[
                        { value: "30", label: "Every 30 seconds" },
                        { value: "60", label: "Every 60 seconds" },
                        { value: "120", label: "Every 120 seconds" },
                      ]}
                      isDark={isDark}
                      className="h-[52px]"
                      triggerClassName="px-3 text-[18px] font-medium"
                    />
                  </div>
                </div>

                <CreateTestToggle
                  title="Force Fullscreen by Default"
                  subtitle="New Tests Will Have Fullscreen Mode Enabled"
                  checked={forceFullscreenDefault}
                  onChange={setForceFullscreenDefault}
                  isDark={isDark}
                />
                <CreateTestToggle
                  title="Disable Copy/Paste by Default"
                  subtitle="New Tests Will Have Copy/Paste Disabled"
                  checked={disableCopyPasteDefault}
                  onChange={setDisableCopyPasteDefault}
                  isDark={isDark}
                />
                <CreateTestToggle
                  title="Disable Tab Switch by Default"
                  subtitle="New Tests Will Detect Tab Changes"
                  checked={disableTabSwitchDefault}
                  onChange={setDisableTabSwitchDefault}
                  isDark={isDark}
                />
                <CreateTestToggle
                  title="Auto End on Tab Change by Default"
                  subtitle="New Tests Will Auto Submit On Tab Switch"
                  checked={autoEndOnTabChangeDefault}
                  onChange={setAutoEndOnTabChangeDefault}
                  isDark={isDark}
                />
                <CreateTestToggle
                  title="Disable Right Click by Default"
                  subtitle="New Tests Will Block Context Menu"
                  checked={disableRightClickDefault}
                  onChange={setDisableRightClickDefault}
                  isDark={isDark}
                />
                <CreateTestToggle
                  title="DevTools Detection by Default"
                  subtitle="New Tests Will Monitor Browser Developer Tools"
                  checked={devToolsDetectionDefault}
                  onChange={setDevToolsDetectionDefault}
                  isDark={isDark}
                />
                <div className="flex items-center justify-end gap-3">
                  {securitySaved ? <p className="text-sm text-emerald-600">{securitySaved}</p> : null}
                  <AppButton variant="primary" size="md" onClick={handleSaveSecurityDefaults} disabled={isSavingSecurity}>
                    {isSavingSecurity ? "Saving..." : "Save Security Defaults"}
                  </AppButton>
                </div>
              </div>
            </SectionCard>
          </div>

          <AdminFooter isDark={isDark} />
        </section>
      </div>
    </main>
  );
}
