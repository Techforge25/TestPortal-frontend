"use client";

import { AdminResultsReviewScreen } from "@/components/admin/screens/AdminResultsReviewScreen";
import { AdminRouteGuard } from "@/components/shared/guards/AdminRouteGuard";

export default function AdminResultsReviewPage() {
  return (
    <AdminRouteGuard>
      <AdminResultsReviewScreen />
    </AdminRouteGuard>
  );
}
