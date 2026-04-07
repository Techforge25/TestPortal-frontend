"use client";

import { AdminCreateTestScreen } from "@/components/admin/screens/AdminCreateTestScreen";
import { AdminRouteGuard } from "@/components/shared/guards/AdminRouteGuard";

export default function AdminCreateTestPage() {
  return (
    <AdminRouteGuard>
      <AdminCreateTestScreen />
    </AdminRouteGuard>
  );
}
