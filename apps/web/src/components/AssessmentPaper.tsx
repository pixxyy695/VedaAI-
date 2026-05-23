"use client";

import { BookMarked, ClipboardCheck, Download, RotateCcw } from "lucide-react";
import type { AssignmentRecord, Difficulty, GeneratedQuestion } from "@vedai/shared";
import { questionTypeLabels } from "@vedai/shared";

function difficultyLabel(difficulty: Difficulty) {
  const labels: Record<Difficulty, string> = {
    easy: "Easy",
    medium: "Moderate",
    hard: "Hard"
  };
  return labels[difficulty];
}

function QuestionRow({ question, index }: { question: GeneratedQuestion; index: number }) {
  return (
    <li className="question-row">
      <div className="question-index">{index + 1}</div>
      <div>
        <p>{question.text}</p>
        <div className="question-meta">
          <span className={`difficulty-badge ${question.difficulty}`}>{difficultyLabel(question.difficulty)}</span>
          <span>{questionTypeLabels[question.type]}</span>
          <span>{question.skill}</span>
        </div>
      </div>
      <strong>{question.marks}</strong>
    </li>
  );
}

export function AssessmentPaper({
  assignment,
  onRegenerate,
  onDownload,
  isBusy
}: {
  assignment: AssignmentRecord;
  onRegenerate: () => void;
  onDownload: () => void;
  isBusy: boolean;
}) {
  const assessment = assignment.result;

  if (!assessment) {
    return (
      <section className="paper-empty">
        <BookMarked size={42} />
        <h2>Question paper is being prepared</h2>
      </section>
    );
  }

  return (
    <section className="paper-workspace">
      <div className="paper-actions">
        <div>
          <p className="eyebrow">Structured Output</p>
          <h2>{assessment.title}</h2>
        </div>
        <div className="action-buttons">
          <button type="button" onClick={onRegenerate} disabled={isBusy} title="Regenerate">
            <RotateCcw size={17} />
            Regenerate
          </button>
          <button type="button" onClick={onDownload} title="Download PDF">
            <Download size={17} />
            PDF
          </button>
        </div>
      </div>

      <article className="exam-paper">
        <header className="exam-header">
          <p>{assessment.subject} · {assessment.grade}</p>
          <h1>{assessment.title}</h1>
          <div className="exam-meta">
            <span>Time: {assessment.durationMinutes} minutes</span>
            <span>Maximum Marks: {assessment.totalMarks}</span>
          </div>
        </header>

        <section className="student-info">
          <label>Name <span /></label>
          <label>Roll Number <span /></label>
          <label>Section <span /></label>
        </section>

        <p className="blueprint-note">{assessment.blueprint}</p>

        {assessment.sections.map((section) => (
          <section className="exam-section" key={section.id}>
            <div className="section-title-row">
              <div>
                <p className="eyebrow">{section.id.replace("-", " ")}</p>
                <h2>{section.title}</h2>
              </div>
              <span>{section.questions.reduce((sum, question) => sum + question.marks, 0)} marks</span>
            </div>
            <p className="section-instruction">{section.instruction}</p>
            <ol className="question-list">
              {section.questions.map((question, index) => (
                <QuestionRow question={question} index={index} key={question.id} />
              ))}
            </ol>
          </section>
        ))}
      </article>

      <section className="answer-key">
        <div className="panel-title">
          <ClipboardCheck size={18} />
          Teacher Marking Guide
        </div>
        {assessment.sections.flatMap((section) => section.questions).map((question, index) => (
          <details key={question.id}>
            <summary>Q{index + 1}. {question.skill}</summary>
            <p>{question.answerGuide}</p>
          </details>
        ))}
      </section>
    </section>
  );
}
