"use client";

import { AdminResultsReviewScreen } from "./AdminResultsReviewPageView";
import { AdminRouteGuard } from "@/components/shared/guards/AdminRouteGuard";

export default function AdminResultsReviewPage() {
  return (
    <AdminRouteGuard>
      <AdminResultsReviewScreen />
    </AdminRouteGuard>
  );
}

