"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  listAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  type AdminNotificationItem,
} from "@/components/admin/lib/backendApi";
import { getAdminToken } from "@/components/admin/lib/adminAuthStorage";
import { useAdminProfile } from "@/components/admin/lib/runtimeSettings";

const defaultAdminAvatar =
  "https://www.figma.com/api/mcp/asset/9b51af98-e896-44c0-8cf0-ba118fcdba39";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]">
      <path
        d="M9.5 17H14.5M10.2 20C10.6 20.6 11.3 21 12 21C12.7 21 13.4 20.6 13.8 20M5 16.8C6 15.8 6.8 14.2 6.8 12.5V10.8C6.8 7.8 9.1 5.4 12 5.4C14.9 5.4 17.2 7.8 17.2 10.8V12.5C17.2 14.2 18 15.8 19 16.8H5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]">
      <path
        d="M14.5 4.8C13.5 4.5 12.4 4.4 11.3 4.6C7.4 5.1 4.4 8.4 4.2 12.4C4 16.9 7.5 20.6 11.9 20.6C15.9 20.6 19.2 17.7 19.9 13.9C20.1 12.8 20 11.7 19.7 10.7C18.7 12.2 17 13.2 15 13.2C11.9 13.2 9.4 10.7 9.4 7.6C9.4 5.8 10.3 4.2 11.6 3.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5 text-slate-500">
      <path
        d="M7.5 5L12.5 10L7.5 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type AdminTopHeaderProps = {
  isDark: boolean;
  onToggleTheme: () => void;
  currentPage?: string;
};

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-[18px]">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 3V5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 18.5V21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M3 12H5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M18.5 12H21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5.8 5.8L7.6 7.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16.4 16.4L18.2 18.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M18.2 5.8L16.4 7.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7.6 16.4L5.8 18.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function NotificationStatusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-8 text-[#2563eb]">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M7.5 12L10.5 15L16.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DoubleCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5">
      <path d="M4.5 12.5L7.5 15.5L12.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12.5L13 15.5L19.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminTopHeader({ isDark, onToggleTheme, currentPage = "Dashboard" }: AdminTopHeaderProps) {
  const router = useRouter();
  const profile = useAdminProfile();
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);

  const prettyTime = (iso: string) => {
    const value = new Date(iso).getTime();
    if (!Number.isFinite(value)) return "";
    const delta = Math.max(0, Date.now() - value);
    const minutes = Math.floor(delta / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  useEffect(() => {
    if (!isNotificationOpen) return;
    const token = getAdminToken();
    if (!token) return;
    void listAdminNotifications(token, { page: 1, pageSize: 50 }).then((response) => {
      setNotifications(response.notifications || []);
    });
  }, [isNotificationOpen]);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const token = getAdminToken();
        if (!token) {
          setNotifications([]);
          return;
        }
        const response = await listAdminNotifications(token, { page: 1, pageSize: 50 });
        setNotifications(response.notifications || []);
      } catch {
        setNotifications([]);
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (!notificationRef.current) return;
      if (!notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }

    void loadNotifications();
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header
      className={`flex items-center justify-between border-b px-8 py-3.5 shadow-[0_4px_28px_rgba(143,154,167,0.16)] ${
        isDark
          ? "border-slate-700 bg-slate-900"
          : "border-[#e3e7ee] bg-[#f2f5ff]"
      }`}
    >
      <div className="flex items-center gap-2 text-base">
        <span className={isDark ? "text-slate-300" : "text-slate-600"}>Admin</span>
        <ChevronRight />
        <span className={`font-semibold ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
          {currentPage}
        </span>
      </div>

      <div className="relative flex items-center gap-4" ref={notificationRef}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsNotificationOpen((prev) => !prev)}
            className={`relative flex size-9 items-center justify-center rounded-full border ${
              isDark
                ? "border-slate-500 bg-slate-800 text-slate-100"
                : "border-[#1f3a8a] bg-white text-[#1f3a8a]"
            }`}
          >
            <BellIcon />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            className={`flex size-9 items-center justify-center rounded-full ${
              isDark ? "bg-slate-100 text-slate-900" : "bg-[#1f3a8a] text-white"
            }`}
            onClick={onToggleTheme}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        <div className={`h-6 w-px ${isDark ? "bg-slate-600" : "bg-slate-300"}`} />

        <div className="flex items-center gap-3">
          <div className="text-right leading-none">
            <p className={`text-base font-medium ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
              {profile.name}
            </p>
            <p className={`mt-1 text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Administrator
            </p>
          </div>
          {profile.avatarDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarDataUrl}
              alt="Administrator avatar"
              className="size-[45px] rounded-lg bg-[#1f3a8a] object-cover"
            />
          ) : (
            <Image
              src={defaultAdminAvatar}
              alt="Administrator avatar"
              className="size-[45px] rounded-lg bg-[#1f3a8a] object-cover"
              width={45}
              height={45}
              unoptimized
            />
          )}
        </div>

        {isNotificationOpen ? (
          <div className={`absolute right-0 top-[52px] z-50 w-[560px] overflow-hidden rounded-[12px] border shadow-[0_22px_60px_rgba(15,23,42,0.22)] ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
            <div className="space-y-6 px-4 py-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className={`text-[32px] font-semibold tracking-[-0.4px] [zoom:0.62] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                  Notifications
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const token = getAdminToken();
                    if (!token) return;
                    void markAllAdminNotificationsAsRead(token).then(async () => {
                      const response = await listAdminNotifications(token, { page: 1, pageSize: 50 });
                      setNotifications(response.notifications || []);
                    });
                  }}
                  className="inline-flex items-center gap-1 text-[16px] font-medium text-[#16a34a] underline"
                >
                  <DoubleCheckIcon />
                  Mark All Read
                </button>
              </div>

              <div className="space-y-6">
                {notifications.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const token = getAdminToken();
                      if (!token) return;
                      void markAdminNotificationAsRead(token, item.id).then(async () => {
                        const response = await listAdminNotifications(token, { page: 1, pageSize: 50 });
                        setNotifications(response.notifications || []);
                      });
                    }}
                    className="flex w-full items-start gap-[10px] text-left"
                  >
                    <div className="flex size-[50px] shrink-0 items-center justify-center rounded-[8px] bg-[#eff6ff]">
                      <NotificationStatusIcon />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[18px] font-medium leading-5 ${isDark ? "text-slate-100" : "text-[#475569]"}`}>
                        {item.title}
                      </p>
                      <p className={`mt-1 text-[16px] leading-6 ${isDark ? "text-slate-400" : "text-[#9ca3af]"}`}>
                        {item.message}
                      </p>
                      <p className={`mt-1 text-[14px] leading-6 ${isDark ? "text-slate-500" : "text-[#9ca3af]"}`}>
                        {prettyTime(item.createdAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className={`border-t px-4 py-5 text-center ${isDark ? "border-slate-700" : "border-[#e2e8f0]"}`}>
              <button
                type="button"
                className="w-full text-[18px] font-medium text-[#1f3a8a]"
                onClick={() => {
                  setIsNotificationOpen(false);
                  router.push("/admin/notifications");
                }}
              >
                View all notifications
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
