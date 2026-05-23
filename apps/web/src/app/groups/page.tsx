import { AuthGate } from "@/components/AuthGate";
import { GroupsPage } from "@/components/WorkspacePages";

export default function Groups() {
  return (
    <AuthGate>
      <GroupsPage />
    </AuthGate>
  );
}
