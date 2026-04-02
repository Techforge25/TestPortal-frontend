"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AdminSidebarItem } from "@/components/admin/components/AdminSidebarItem";
import { clearAdminToken } from "@/components/admin/lib/adminAuthStorage";
import { AppButton } from "@/components/shared/ui/AppButton";
import { useAdminBranding } from "@/components/admin/lib/runtimeSettings";

function DashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="size-6 fill-current">
      <path d="M513.33-580v-260H840v260H513.33ZM120-446.67V-840h326.67v393.33H120ZM513.33-120v-393.33H840V-120H513.33ZM120-120v-260h326.67v260H120Zm66.67-393.33H380v-260H186.67v260ZM580-186.67h193.33v-260H580v260Zm0-460h193.33v-126.66H580v126.66Zm-393.33 460H380v-126.66H186.67v126.66ZM380-513.33Zm200-133.34Zm0 200ZM380-313.33Z" />
    </svg>
  );
}

function ResultsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="size-6 fill-current">
      <path d="m222-209.33-142-142L126.67-398l95 94.33 176-176L444.33-432 222-209.33Zm0-320-142-142L126.67-718l95 94.33 176-176L444.33-752 222-529.33Zm298 242.66v-66.66h360v66.66H520Zm0-320v-66.66h360v66.66H520Z" />
    </svg>
  );
}

function CreateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path
        d="M12 4L20 12L12 20L4 12L12 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M12 8V16" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12H16" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M7 6H20" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 12H20" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 18H20" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 6H4.01" stroke="currentColor" strokeWidth="2.4" />
      <path d="M4 12H4.01" stroke="currentColor" strokeWidth="2.4" />
      <path d="M4 18H4.01" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}

function CandidateIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="size-6 fill-current">
      <path d="M38.67-160v-100q0-34.67 17.83-63.17T105.33-366q69.34-31.67 129.67-46.17 60.33-14.5 123.67-14.5 63.33 0 123.33 14.5T611.33-366q31 14.33 49.17 42.83T678.67-260v100h-640Zm706.66 0v-102.67q0-56.66-29.5-97.16t-79.16-66.84q63 7.34 118.66 22.5 55.67 15.17 94 35.5 34 19.34 53 46.17 19 26.83 19 59.83V-160h-176ZM249-524.33Q205.33-568 205.33-634T249-743.67q43.67-43.66 109.67-43.66t109.66 43.66Q512-700 512-634t-43.67 109.67q-43.66 43.66-109.66 43.66T249-524.33Zm439.33 0q-43.66 43.66-109.66 43.66-11 0-25.67-1.83-14.67-1.83-25.67-5.5 25-27.33 38.17-64.67Q578.67-590 578.67-634t-13.17-80q-13.17-36-38.17-66 12-3.67 25.67-5.5 13.67-1.83 25.67-1.83 66 0 109.66 43.66Q732-700 732-634t-43.67 109.67Zm-583 297.66H612V-260q0-14.33-8.17-27.33-8.16-13-20.5-18.67-66-30.33-117-42.17-51-11.83-107.66-11.83-56.67 0-108 11.83-51.34 11.84-117.34 42.17-12.33 5.67-20.16 18.67-7.84 13-7.84 27.33v33.33Zm315.17-345.5Q445.33-597 445.33-634t-24.83-61.83q-24.83-24.84-61.83-24.84t-61.84 24.84Q272-671 272-634t24.83 61.83q24.84 24.84 61.84 24.84t61.83-24.84Zm-61.83 345.5Zm0-407.33Z" />
    </svg>
  );
}

function ViolationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M12 4L21 20H3L12 4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 9V14" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="size-6 fill-current">
      <path d="m382-80-18.67-126.67q-17-6.33-34.83-16.66-17.83-10.34-32.17-21.67L178-192.33 79.33-365l106.34-78.67q-1.67-8.33-2-18.16-.34-9.84-.34-18.17 0-8.33.34-18.17.33-9.83 2-18.16L79.33-595 178-767.67 296.33-715q14.34-11.33 32.34-21.67 18-10.33 34.66-16L382-880h196l18.67 126.67q17 6.33 35.16 16.33 18.17 10 31.84 22L782-767.67 880.67-595l-106.34 77.33q1.67 9 2 18.84.34 9.83.34 18.83 0 9-.34 18.5Q776-452 774-443l106.33 78-98.66 172.67-118-52.67q-14.34 11.33-32 22-17.67 10.67-35 16.33L578-80H382Zm55.33-66.67h85l14-110q32.34-8 60.84-24.5T649-321l103.67 44.33 39.66-70.66L701-415q4.33-16 6.67-32.17Q710-463.33 710-480q0-16.67-2-32.83-2-16.17-7-32.17l91.33-67.67-39.66-70.66L649-638.67q-22.67-25-50.83-41.83-28.17-16.83-61.84-22.83l-13.66-110h-85l-14 110q-33 7.33-61.5 23.83T311-639l-103.67-44.33-39.66 70.66L259-545.33Q254.67-529 252.33-513 250-497 250-480q0 16.67 2.33 32.67 2.34 16 6.67 32.33l-91.33 67.67 39.66 70.66L311-321.33q23.33 23.66 51.83 40.16 28.5 16.5 60.84 24.5l13.66 110Zm43.34-200q55.33 0 94.33-39T614-480q0-55.33-39-94.33t-94.33-39q-55.67 0-94.5 39-38.84 39-38.84 94.33t38.84 94.33q38.83 39 94.5 39ZM480-480Z" />
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="size-6 fill-current">
      <path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z" />
    </svg>
  );
}

function BrandMark() {
  return (
    <svg viewBox="0 0 50 34" className="h-[38px] w-[56px]" fill="none">
      <rect x="1.5" y="1.5" width="30" height="30" rx="7" stroke="#ffffff" strokeWidth="3" />
      <path d="M10 16L16 22L27 11" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 23C33 21.5 35 19 36 15" stroke="#15A8FF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path d="M14 7L19 12L14 17" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19 12H10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 4H6C4.9 4 4 4.9 4 6V18C4 19.1 4.9 20 6 20H10" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

type AdminSidebarProps = {
  isDark: boolean;
  activeItem?:
    | "dashboard"
    | "results"
    | "create"
    | "list"
    | "candidate"
    | "violations"
    | "settings"
    | "notifications";
};

export function AdminSidebar({ isDark, activeItem = "dashboard" }: AdminSidebarProps) {
  const router = useRouter();
  const branding = useAdminBranding();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (showLogoutModal) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showLogoutModal]);

  useEffect(() => {
    const routes = [
      "/admin",
      "/admin/results-review",
      "/admin/create-test",
      "/admin/test-list",
      "/admin/candidate",
      "/admin/violations-log",
      "/admin/notifications",
      "/admin/settings",
    ];
    for (const path of routes) {
      router.prefetch(path);
    }
  }, [router]);

  return (
    <aside
      className={`sticky top-0 hidden h-screen w-[281px] shrink-0 overflow-hidden rounded-br-3xl border lg:block ${
        isDark
          ? "border-slate-700 bg-slate-950"
          : "border-slate-200 bg-[#f9fafb]"
      }`}
    >
      <div
        className={`flex h-[76px] items-center gap-1.5 pl-[16px] ${
          isDark ? "bg-slate-900" : "bg-[#171d39]"
        }`}
      >
        {branding.logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logoDataUrl} alt="Company logo" className="h-[58px] w-[250px] rounded object-contain" />
        ) : (
          <BrandMark />
        )}
      </div>

      <div className="px-[31px] pt-[54px]">
        <div className="space-y-[18px]">
          <AdminSidebarItem
            label="Dashboard"
            icon={<DashboardIcon />}
            href="/admin"
            active={activeItem === "dashboard"}
            isDark={isDark}
          />
          <AdminSidebarItem
            label="Results & Review"
            icon={<ResultsIcon />}
            href="/admin/results-review"
            active={activeItem === "results"}
            isDark={isDark}
          />
          <AdminSidebarItem
            label="Create Test"
            icon={<CreateIcon />}
            href="/admin/create-test"
            active={activeItem === "create"}
            isDark={isDark}
          />
          <AdminSidebarItem
            label="Test List"
            icon={<ListIcon />}
            href="/admin/test-list"
            active={activeItem === "list"}
            isDark={isDark}
          />
          <AdminSidebarItem
            label="Candidate"
            icon={<CandidateIcon />}
            href="/admin/candidate"
            active={activeItem === "candidate"}
            isDark={isDark}
          />
          <AdminSidebarItem
            label="Violations Log"
            icon={<ViolationIcon />}
            href="/admin/violations-log"
            active={activeItem === "violations"}
            isDark={isDark}
          />
          <AdminSidebarItem
            label="Notifications"
            icon={<NotificationIcon />}
            href="/admin/notifications"
            active={activeItem === "notifications"}
            isDark={isDark}
          />
          <AdminSidebarItem
            label="Settings"
            icon={<SettingsIcon />}
            href="/admin/settings"
            active={activeItem === "settings"}
            isDark={isDark}
          />
        </div>
      </div>

      <div className="absolute bottom-8 left-[31px]">
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className={`flex items-center gap-1.5 px-4 transition ${
            isDark ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-700"
          }`}
        >
          <LogoutIcon />
          <span className="text-base leading-9">Logout</span>
        </button>
      </div>

      {typeof document !== "undefined" && showLogoutModal
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/65 backdrop-blur-[2px] px-4">
              <div className={`w-full max-w-[440px] rounded-[14px] border p-6 shadow-[0_24px_80px_rgba(15,23,42,0.38)] ${
                isDark ? "border-slate-700 bg-slate-900" : "border-[#dbe3ef] bg-white"
              }`}>
                <h3 className={`text-[30px] font-semibold tracking-[-0.45px] [zoom:0.58] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                  Confirm Logout
                </h3>
                <p className={`mt-2 text-sm ${isDark ? "text-slate-300" : "text-[#64748b]"}`}>Are you sure you want to logout?</p>
                <div className="mt-6 flex justify-end gap-3">
                  <AppButton variant="ghost" onClick={() => setShowLogoutModal(false)}>Cancel</AppButton>
                  <AppButton
                    variant="danger"
                    onClick={() => {
                      clearAdminToken();
                      setShowLogoutModal(false);
                      router.push("/admin");
                    }}
                  >
                    Logout
                  </AppButton>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </aside>
  );
}
