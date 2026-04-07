"use client";

import { AdminViolationsLogScreen } from "@/components/admin/screens/AdminViolationsLogScreen";
import { AdminRouteGuard } from "@/components/shared/guards/AdminRouteGuard";

export default function AdminViolationsLogPage() {
  return (
    <AdminRouteGuard>
      <AdminViolationsLogScreen />
    </AdminRouteGuard>
  );
}
