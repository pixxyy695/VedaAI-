import { AuthGate } from "@/components/AuthGate";
import { AssignmentsPage } from "@/components/WorkspacePages";

export default function Assignments() {
  return (
    <AuthGate>
      <AssignmentsPage />
    </AuthGate>
  );
}
