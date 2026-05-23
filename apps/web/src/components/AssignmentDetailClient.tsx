"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import type { AssignmentRecord } from "@vedai/shared";
import { getAssignment, regenerateAssignment } from "@/lib/api";
import { downloadAssignmentPdf } from "@/lib/pdfExport";
import { useAssignmentSocket } from "@/lib/useAssignmentSocket";
import { useAssignmentStore } from "@/store/assignmentStore";
import { useAuthStore } from "@/store/authStore";
import { AssessmentPaper } from "./AssessmentPaper";
import { GenerationProgress } from "./GenerationProgress";

export function AssignmentDetailClient({ assignmentId }: { assignmentId: string }) {
  const storedAssignment = useAssignmentStore((state) => state.assignments[assignmentId]);
  const upsertAssignment = useAssignmentStore((state) => state.upsertAssignment);
  const token = useAuthStore((state) => state.token);
  const [assignment, setAssignment] = useState<AssignmentRecord | null>(storedAssignment ?? null);
  const [loading, setLoading] = useState(!storedAssignment);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleAssignment = (nextAssignment: AssignmentRecord) => {
    setAssignment(nextAssignment);
    upsertAssignment(nextAssignment);
  };

  const socketState = useAssignmentSocket(assignmentId, token, handleAssignment);

  useEffect(() => {
    let cancelled = false;

    if (!token) return;

    getAssignment(assignmentId, token)
      .then(({ assignment: nextAssignment }) => {
        if (cancelled) return;
        handleAssignment(nextAssignment);
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError instanceof Error ? requestError.message : "Unable to load assignment");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assignmentId, token]);

  const isGenerating = useMemo(() => {
    if (!assignment) return true;
    return !["completed", "failed"].includes(assignment.status);
  }, [assignment]);

  const regenerate = async () => {
    setBusy(true);
    setError("");
    try {
      const { assignment: nextAssignment } = await regenerateAssignment(assignmentId, token);
      handleAssignment(nextAssignment);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to regenerate assignment");
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!assignment?.result) return;
    await downloadAssignmentPdf(assignment);
  };

  if (loading) {
    return (
      <main className="detail-shell centered">
        <LoaderCircle className="spin" size={30} />
      </main>
    );
  }

  if (!assignment) {
    return (
      <main className="detail-shell centered">
        <p className="server-error">{error || "Assignment not found"}</p>
        <Link className="back-link" href="/">
          <ArrowLeft size={16} />
          Back to creator
        </Link>
      </main>
    );
  }

  return (
    <main className="detail-shell">
      <nav className="detail-nav">
        <Link className="back-link" href="/">
          <ArrowLeft size={16} />
          New assignment
        </Link>
        <span>Due {assignment.input.dueDate}</span>
      </nav>

      <GenerationProgress assignment={assignment} socketState={socketState} />

      {error && <p className="server-error">{error}</p>}

      <AssessmentPaper
        assignment={assignment}
        isBusy={busy || isGenerating}
        onRegenerate={regenerate}
        onDownload={download}
      />
    </main>
  );
}
