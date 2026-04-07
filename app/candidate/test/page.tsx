import { CandidateMcqTestScreen } from "@/components/candidate/screens/CandidateMcqTestScreen";
import { CandidateRouteGuard } from "@/components/shared/guards/CandidateRouteGuard";

export default function CandidateTestPage() {
  return (
    <CandidateRouteGuard mode="session">
      <CandidateMcqTestScreen />
    </CandidateRouteGuard>
  );
}
