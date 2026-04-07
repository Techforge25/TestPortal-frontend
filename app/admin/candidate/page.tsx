"use client";

import { AdminCandidatesScreen } from "@/components/admin/screens/AdminCandidatesScreen";
import { AdminRouteGuard } from "@/components/shared/guards/AdminRouteGuard";

export default function AdminCandidatePage() {
  return (
    <AdminRouteGuard>
      <AdminCandidatesScreen />
    </AdminRouteGuard>
  );
}
