import { CandidateSubmissionSuccessScreen } from "./CandidateSubmissionSuccessScreen";
import { CandidateRouteGuard } from "@/components/shared/guards/CandidateRouteGuard";

export default function CandidateSubmittedPage() {
  return (
    <CandidateRouteGuard mode="session">
      <CandidateSubmissionSuccessScreen />
    </CandidateRouteGuard>
  );
}
