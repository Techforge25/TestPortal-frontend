import { CandidateAssessmentSectionScreen } from "../assessment/CandidateAssessmentSectionScreen";
import { CandidateRouteGuard } from "@/components/shared/guards/CandidateRouteGuard";

export default function CandidateUiPreviewPage() {
  return (
    <CandidateRouteGuard mode="session">
      <CandidateAssessmentSectionScreen mode="ui_preview" />
    </CandidateRouteGuard>
  );
}
