"use client";

import { AdminTestListScreen } from "@/components/admin/screens/AdminTestListScreen";
import { AdminRouteGuard } from "@/components/shared/guards/AdminRouteGuard";

export default function AdminTestListPage() {
  return (
    <AdminRouteGuard>
      <AdminTestListScreen />
    </AdminRouteGuard>
  );
}
