import { CandidatePreTestScreen } from "./CandidatePreTestScreen";
import { CandidateRouteGuard } from "@/components/shared/guards/CandidateRouteGuard";

export default function CandidatePreTestPage() {
  return (
    <CandidateRouteGuard mode="session">
      <CandidatePreTestScreen />
    </CandidateRouteGuard>
  );
}
