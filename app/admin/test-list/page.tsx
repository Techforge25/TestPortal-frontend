"use client";

import { AdminTestListScreen } from "./AdminTestListPageView";
import { AdminRouteGuard } from "@/components/shared/guards/AdminRouteGuard";

export default function AdminTestListPage() {
  return (
    <AdminRouteGuard>
      <AdminTestListScreen />
    </AdminRouteGuard>
  );
}

