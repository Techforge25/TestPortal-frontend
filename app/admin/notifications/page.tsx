"use client";

import { AdminNotificationsScreen } from "@/components/admin/screens/AdminNotificationsScreen";
import { AdminRouteGuard } from "@/components/shared/guards/AdminRouteGuard";

export default function AdminNotificationsPage() {
  return (
    <AdminRouteGuard>
      <AdminNotificationsScreen />
    </AdminRouteGuard>
  );
}
