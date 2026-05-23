import { AuthGate } from "@/components/AuthGate";
import { ToolkitPage } from "@/components/WorkspacePages";

export default function Toolkit() {
  return (
    <AuthGate>
      <ToolkitPage />
    </AuthGate>
  );
}
