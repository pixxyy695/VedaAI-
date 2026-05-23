import { AuthGate } from "@/components/AuthGate";
import { DashboardPage } from "@/components/WorkspacePages";

export default function Dashboard() {
  return (
    <AuthGate>
      <DashboardPage />
    </AuthGate>
  );
}
