import { CandidateCodingTaskScreen } from "@/components/candidate/screens/CandidateCodingTaskScreen";
import { CandidateRouteGuard } from "@/components/shared/guards/CandidateRouteGuard";

export default function CandidateTasksPage() {
  return (
    <CandidateRouteGuard mode="session">
      <CandidateCodingTaskScreen />
    </CandidateRouteGuard>
  );
}
