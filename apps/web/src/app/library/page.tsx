import { AuthGate } from "@/components/AuthGate";
import { LibraryPage } from "@/components/WorkspacePages";

export default function Library() {
  return (
    <AuthGate>
      <LibraryPage />
    </AuthGate>
  );
}
