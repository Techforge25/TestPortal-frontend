"use client";

import { AdminSettingsScreen } from "./AdminSettingsPageView";
import { AdminRouteGuard } from "@/components/shared/guards/AdminRouteGuard";

export default function AdminSettingsPage() {
  return (
    <AdminRouteGuard>
      <AdminSettingsScreen />
    </AdminRouteGuard>
  );
}

