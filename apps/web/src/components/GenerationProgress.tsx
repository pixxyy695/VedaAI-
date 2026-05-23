"use client";

import { CheckCircle2, CircleDashed, LoaderCircle, XCircle } from "lucide-react";
import type { AssignmentRecord, GenerationStatus } from "@vedai/shared";

const stages: Array<{ status: GenerationStatus; label: string }> = [
  { status: "queued", label: "Queued" },
  { status: "prompting", label: "Prompt" },
  { status: "generating", label: "Generate" },
  { status: "structuring", label: "Validate" },
  { status: "completed", label: "Ready" }
];

const order: GenerationStatus[] = ["queued", "reading_source", "prompting", "generating", "structuring", "completed", "failed"];

export function GenerationProgress({ assignment, socketState }: { assignment: AssignmentRecord; socketState: string }) {
  const currentIndex = order.indexOf(assignment.status);

  return (
    <section className="progress-panel">
      <div className="progress-head">
        <div>
          <p className="eyebrow">Generation</p>
          <h2>{assignment.statusMessage}</h2>
        </div>
        <span className={`socket-pill ${socketState}`}>
          {socketState === "connected" ? <CheckCircle2 size={15} /> : <CircleDashed size={15} />}
          {socketState}
        </span>
      </div>

      <div className="progress-track">
        <span style={{ width: `${assignment.progress}%` }} />
      </div>

      <div className="stage-row">
        {stages.map((stage) => {
          const stageIndex = order.indexOf(stage.status);
          const complete = assignment.status === "completed" || currentIndex >= stageIndex;
          const active = assignment.status === stage.status || (assignment.status === "reading_source" && stage.status === "queued");
          return (
            <div className={complete ? "stage complete" : active ? "stage active" : "stage"} key={stage.status}>
              {assignment.status === "failed" && active ? <XCircle size={17} /> : active ? <LoaderCircle className="spin" size={17} /> : <CheckCircle2 size={17} />}
              <span>{stage.label}</span>
            </div>
          );
        })}
      </div>

      {assignment.error && <p className="server-error">{assignment.error}</p>}
    </section>
  );
}
