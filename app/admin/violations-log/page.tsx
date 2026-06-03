"use client";

import { AdminViolationsLogScreen } from "./AdminViolationsLogPageView";
import { AdminRouteGuard } from "@/components/shared/guards/AdminRouteGuard";

export default function AdminViolationsLogPage() {
  return (
    <AdminRouteGuard>
      <AdminViolationsLogScreen />
    </AdminRouteGuard>
  );
}

