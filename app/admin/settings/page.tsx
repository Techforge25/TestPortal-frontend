"use client";

import { AdminSettingsScreen } from "@/components/admin/screens/AdminSettingsScreen";
import { AdminRouteGuard } from "@/components/shared/guards/AdminRouteGuard";

export default function AdminSettingsPage() {
  return (
    <AdminRouteGuard>
      <AdminSettingsScreen />
    </AdminRouteGuard>
  );
}
