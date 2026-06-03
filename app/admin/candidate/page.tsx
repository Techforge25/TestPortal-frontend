"use client";

import { AdminCandidatesScreen } from "./AdminCandidatePageView";
import { AdminRouteGuard } from "@/components/shared/guards/AdminRouteGuard";

export default function AdminCandidatePage() {
  return (
    <AdminRouteGuard>
      <AdminCandidatesScreen />
    </AdminRouteGuard>
  );
}

