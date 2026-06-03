"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminResultReviewDetailScreen } from "./AdminResultReviewDetailContent";
import { AdminRouteGuard } from "@/components/shared/guards/AdminRouteGuard";

function AdminResultsReviewDetailPageContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId") || "";
  return <AdminResultReviewDetailScreen submissionId={submissionId} />;
}

export default function AdminResultsReviewDetailPage() {
  return (
    <AdminRouteGuard>
      <Suspense fallback={null}>
        <AdminResultsReviewDetailPageContent />
      </Suspense>
    </AdminRouteGuard>
  );
}

