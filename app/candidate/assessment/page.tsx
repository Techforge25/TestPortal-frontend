import { CandidateAssessmentSectionScreen } from "./CandidateAssessmentSectionScreen";
import { CandidateRouteGuard } from "@/components/shared/guards/CandidateRouteGuard";

export default function CandidateAssessmentPage() {
  return (
    <CandidateRouteGuard mode="session">
      <CandidateAssessmentSectionScreen />
    </CandidateRouteGuard>
  );
}

