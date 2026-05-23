"use client";

import { Activity, FileStack, Gauge, RadioTower, ShieldCheck } from "lucide-react";
import { questionTypeLabels } from "@vedai/shared";
import { useAssignmentStore } from "@/store/assignmentStore";
import { AssignmentHistory } from "./AssignmentHistory";

export function CreatorAside() {
  const draft = useAssignmentStore((state) => state.draft);
  const totalMarks = draft.numberOfQuestions * draft.marksPerQuestion;

  return (
    <aside className="creator-aside">
      <div className="aside-panel signal-panel">
        <div className="signal-mark">
          <RadioTower size={24} />
        </div>
        <p className="eyebrow">Live Flow</p>
        <h2>API → Queue → Worker → WebSocket</h2>
        <div className="flow-line">
          <span>Request</span>
          <span>Prompt</span>
          <span>Paper</span>
        </div>
      </div>

      <div className="aside-panel blueprint-panel">
        <div className="panel-title">
          <FileStack size={18} />
          Paper Blueprint
        </div>
        <dl className="blueprint-list">
          <div>
            <dt>Total marks</dt>
            <dd>{Number.isFinite(totalMarks) ? totalMarks : 0}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{draft.durationMinutes || 0} min</dd>
          </div>
          <div>
            <dt>Difficulty</dt>
            <dd>{draft.difficultyMix.easy}/{draft.difficultyMix.medium}/{draft.difficultyMix.hard}</dd>
          </div>
        </dl>
      </div>

      <div className="aside-panel compact">
        <div className="panel-title">
          <Gauge size={18} />
          Selected Modes
        </div>
        <div className="chip-wrap">
          {draft.questionTypes.map((type) => (
            <span className="soft-chip" key={type}>{questionTypeLabels[type]}</span>
          ))}
        </div>
      </div>

      <div className="aside-panel compact">
        <div className="panel-title">
          <ShieldCheck size={18} />
          Generation Contract
        </div>
        <ul className="contract-list">
          <li><Activity size={14} /> Structured prompt</li>
          <li><Activity size={14} /> Parsed schema output</li>
          <li><Activity size={14} /> Stored result record</li>
        </ul>
      </div>

      <AssignmentHistory />
    </aside>
  );
}
