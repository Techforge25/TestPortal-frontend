import { CandidateCodingTaskScreen } from "./CandidateCodingTaskScreen";
import { CandidateRouteGuard } from "@/components/shared/guards/CandidateRouteGuard";

export default function CandidateTasksPage() {
  return (
    <CandidateRouteGuard mode="session">
      <CandidateCodingTaskScreen />
    </CandidateRouteGuard>
  );
}
