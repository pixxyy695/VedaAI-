import { AuthGate } from "@/components/AuthGate";
import { AssignmentDetailClient } from "@/components/AssignmentDetailClient";

export default async function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AuthGate>
      <AssignmentDetailClient assignmentId={id} />
    </AuthGate>
  );
}
