"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminFooter } from "@/components/admin/components/AdminFooter";
import { AdminSidebar } from "@/components/admin/components/AdminSidebar";
import { AdminTopHeader } from "@/components/admin/components/AdminTopHeader";
import { useAdminTheme } from "@/components/admin/hooks/useAdminTheme";
import {
  listAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  type AdminNotificationItem,
} from "@/components/admin/lib/backendApi";
import { getAdminToken } from "@/components/admin/lib/adminAuthStorage";
import { useRealtimeSubscription } from "@/components/shared/realtime/useRealtimeSubscription";

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

function prettyTime(iso: string) {
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
}

type AdminNotificationsScreenProps = {
  initialThemeDark?: boolean;
};

export function AdminNotificationsScreen({ initialThemeDark = false }: AdminNotificationsScreenProps) {
  const { isDark, toggleTheme } = useAdminTheme(initialThemeDark);
  const token = getAdminToken();
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);

  async function refreshNotifications() {
    const token = getAdminToken();
    if (!token) {
      setNotifications([]);
      return;
    }
    try {
      const response = await listAdminNotifications(token, { page: 1, pageSize: 100 });
      setNotifications(response.notifications || []);
    } catch {
      setNotifications([]);
    }
  }

  useEffect(() => {
    void refreshNotifications();
  }, []);

  useRealtimeSubscription({
    token,
    events: ["admin:notifications.updated", "admin:data.changed"],
    onEvent: async () => {
      await refreshNotifications();
    },
    enabled: Boolean(token),
  });

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [notifications]
  );
  const unreadCount = sortedNotifications.filter((item) => !item.isRead).length;

  return (
    <main className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-[#f8fafc]"}`}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar isDark={isDark} activeItem="notifications" />

        <section className="flex w-full flex-col">
          <AdminTopHeader isDark={isDark} onToggleTheme={toggleTheme} currentPage="Notifications" />

          <div className="flex-1 px-6 pb-8 pt-7">
            <section className={`rounded-[12px] border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-[#e2e8f0] bg-white"}`}>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className={`text-[44px] font-semibold tracking-[-0.6px] [zoom:0.58] ${isDark ? "text-slate-100" : "text-[#0f172a]"}`}>
                    Notifications
                  </h1>
                  <p className={`${isDark ? "text-slate-400" : "text-[#64748b]"}`}>
                    {unreadCount} unread notifications
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const token = getAdminToken();
                    if (!token) return;
                    void markAllAdminNotificationsAsRead(token).then(() => refreshNotifications());
                  }}
                  className="inline-flex items-center gap-1 text-[16px] font-medium text-[#16a34a] underline"
                >
                  <DoubleCheckIcon />
                  Mark All Read
                </button>
              </div>

              <div className="space-y-5">
                {sortedNotifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`flex w-full items-start gap-[10px] rounded-[10px] border p-3 text-left ${
                      item.isRead
                        ? isDark
                          ? "border-slate-700 bg-slate-900"
                          : "border-[#e2e8f0] bg-white"
                        : isDark
                          ? "border-slate-600 bg-slate-800"
                          : "border-[#dbe3ef] bg-[#f8fbff]"
                    }`}
                    onClick={() => {
                      const token = getAdminToken();
                      if (!token) return;
                      void markAdminNotificationAsRead(token, item.id).then(() => refreshNotifications());
                    }}
                  >
                    <div className="flex size-[50px] shrink-0 items-center justify-center rounded-[8px] bg-[#eff6ff]">
                      <NotificationStatusIcon />
                    </div>
                    <div className="flex-1">
                      <p className={`text-[18px] font-medium leading-5 ${isDark ? "text-slate-100" : "text-[#475569]"}`}>
                        {item.title}
                      </p>
                      <p className={`mt-1 text-[16px] leading-6 ${isDark ? "text-slate-400" : "text-[#9ca3af]"}`}>
                        {item.message}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <p className={`text-[14px] leading-6 ${isDark ? "text-slate-500" : "text-[#9ca3af]"}`}>
                          {prettyTime(item.createdAt)}
                        </p>
                        {!item.isRead ? (
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#1f3a8a]" />
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <AdminFooter isDark={isDark} />
        </section>
      </div>
    </main>
  );
}
