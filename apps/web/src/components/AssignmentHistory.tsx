"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock3, FileStack, LoaderCircle } from "lucide-react";
import type { AssignmentRecord } from "@vedai/shared";
import { listAssignments } from "@/lib/api";
import { useAssignmentStore } from "@/store/assignmentStore";
import { useAuthStore } from "@/store/authStore";

export function AssignmentHistory() {
  const token = useAuthStore((state) => state.token);
  const upsertAssignment = useAssignmentStore((state) => state.upsertAssignment);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    listAssignments(token)
      .then(({ assignments: nextAssignments }) => {
        if (cancelled) return;
        setAssignments(nextAssignments);
        nextAssignments.forEach(upsertAssignment);
      })
      .catch(() => {
        if (!cancelled) setAssignments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, upsertAssignment]);

  return (
    <div className="aside-panel compact">
      <div className="panel-title">
        <FileStack size={18} />
        My Assessments
      </div>
      {loading ? (
        <p className="muted-line"><LoaderCircle className="spin" size={15} /> Loading</p>
      ) : assignments.length === 0 ? (
        <p className="muted-line">No saved papers yet.</p>
      ) : (
        <div className="history-list">
          {assignments.slice(0, 5).map((assignment) => (
            <Link href={`/assignment/${assignment.id}`} key={assignment.id}>
              <strong>{assignment.input.title}</strong>
              <span><Clock3 size={13} /> {assignment.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
