"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminResultReviewDetailScreen } from "@/components/admin/screens/AdminResultReviewDetailScreen";

function AdminResultsReviewDetailPageContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId") || "";
  return <AdminResultReviewDetailScreen submissionId={submissionId} />;
}

export default function AdminResultsReviewDetailPage() {
  return (
    <Suspense fallback={null}>
      <AdminResultsReviewDetailPageContent />
    </Suspense>
  );
}
