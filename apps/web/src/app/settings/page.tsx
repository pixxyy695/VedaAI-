import { AuthGate } from "@/components/AuthGate";
import { SettingsPage } from "@/components/WorkspacePages";

export default function Settings() {
  return (
    <AuthGate>
      <SettingsPage />
    </AuthGate>
  );
}
