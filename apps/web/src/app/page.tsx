import { AssignmentForm } from "@/components/AssignmentForm";
import { AuthGate } from "@/components/AuthGate";

export default function Home() {
  return (
    <AuthGate>
      <main className="creator-shell">
        <AssignmentForm />
      </main>
    </AuthGate>
  );
}
