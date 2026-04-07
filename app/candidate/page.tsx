import { CandidateRegistrationScreen } from "@/components/candidate/screens/CandidateRegistrationScreen";
import { CandidateRouteGuard } from "@/components/shared/guards/CandidateRouteGuard";

export default function CandidatePage() {
  return (
    <CandidateRouteGuard mode="auth_draft">
      <CandidateRegistrationScreen />
    </CandidateRouteGuard>
  );
}
