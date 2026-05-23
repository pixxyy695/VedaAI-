"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  GraduationCap,
  Hash,
  Layers3,
  LoaderCircle,
  MessageSquareText,
  Mic,
  Paperclip,
  Plus,
  Sparkles,
  UploadCloud,
  X
} from "lucide-react";
import { questionTypeLabels, type QuestionType } from "@vedai/shared";
import { createAssignment } from "@/lib/api";
import { useAssignmentStore } from "@/store/assignmentStore";
import { useAuthStore } from "@/store/authStore";

const questionTypes: QuestionType[] = [
  "multiple_choice",
  "short_answer",
  "long_answer",
  "case_study",
  "true_false"
];

const difficultyKeys = [
  ["easy", "Easy"],
  ["medium", "Moderate"],
  ["hard", "Hard"]
] as const;

export function AssignmentForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const token = useAuthStore((state) => state.token);
  const {
    draft,
    sourceFile,
    sourceFileName,
    errors,
    isSubmitting,
    setField,
    setDifficulty,
    toggleQuestionType,
    setSourceFile,
    validateDraft,
    setSubmitting,
    upsertAssignment
  } = useAssignmentStore();

  const difficultyTotal = draft.difficultyMix.easy + draft.difficultyMix.medium + draft.difficultyMix.hard;
  const totalMarks = draft.numberOfQuestions * draft.marksPerQuestion;
  const selectedCount = draft.questionTypes.length;

  const addQuestionType = () => {
    const nextType = questionTypes.find((type) => !draft.questionTypes.includes(type));
    if (nextType) toggleQuestionType(nextType);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError("");

    const parsed = validateDraft();
    if (!parsed) return;

    setSubmitting(true);
    try {
      const { assignment } = await createAssignment(parsed, sourceFile, token);
      upsertAssignment(assignment);
      router.push(`/assignment/${assignment.id}`);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="creator-form assignment-wizard" onSubmit={submit}>
      <header className="create-heading">
        <span className="live-dot" />
        <div>
          <h1>Create Assignment</h1>
          <p>Set up a new assignment for your students</p>
        </div>
      </header>

      <div className="wizard-progress" aria-hidden="true">
        <span />
        <span />
      </div>

      <section className="wizard-card">
        <div className="wizard-card-title">
          <h2>Assignment Details</h2>
          <p>Basic information about your assignment</p>
        </div>

        <label className="upload-well">
          <input
            type="file"
            accept=".pdf,.txt,.md,text/plain,application/pdf"
            onChange={(event) => setSourceFile(event.target.files?.[0] ?? null)}
          />
          <UploadCloud size={30} />
          <strong>{sourceFileName || "Choose a file or drag & drop it here"}</strong>
          <small>PDF, TXT, MD, up to 8MB</small>
          <em>Browse Files</em>
        </label>
        <p className="upload-caption">Upload images or text notes of your preferred document/image</p>

        <div className="field-grid three compact-fields">
          <label className="field">
            <span>
              <FileText size={16} />
              Assignment title
            </span>
            <input
              value={draft.title}
              onChange={(event) => setField("title", event.target.value)}
              placeholder="Quiz on Electricity"
            />
            {errors.title && <small>{errors.title}</small>}
          </label>

          <label className="field">
            <span>
              <Layers3 size={16} />
              Subject
            </span>
            <input
              value={draft.subject}
              onChange={(event) => setField("subject", event.target.value)}
              placeholder="Science"
            />
            {errors.subject && <small>{errors.subject}</small>}
          </label>

          <label className="field">
            <span>
              <GraduationCap size={16} />
              Class
            </span>
            <input
              value={draft.grade}
              onChange={(event) => setField("grade", event.target.value)}
              placeholder="Class 8"
            />
            {errors.grade && <small>{errors.grade}</small>}
          </label>
        </div>

        <label className="field date-field">
          <span>
            <CalendarDays size={16} />
            Due Date
          </span>
          <input
            type="date"
            value={draft.dueDate}
            onChange={(event) => setField("dueDate", event.target.value)}
          />
          {errors.dueDate && <small>{errors.dueDate}</small>}
        </label>

        <div className="question-table-head">
          <span>Question Type</span>
          <span>No. of Questions</span>
          <span>Marks</span>
        </div>

        <div className="question-type-list">
          {questionTypes.map((type) => {
            const active = draft.questionTypes.includes(type);
            return (
              <button
                type="button"
                key={type}
                className={active ? "question-type-row active" : "question-type-row"}
                onClick={() => toggleQuestionType(type)}
              >
                <span className="question-name">
                  <span className="check-dot">{active && <Check size={14} />}</span>
                  {questionTypeLabels[type]}
                  <ChevronDown size={16} />
                </span>
                <span className="mini-stepper">
                  <span>-</span>
                  {active ? Math.max(1, Math.round(draft.numberOfQuestions / selectedCount)) : 0}
                  <span>+</span>
                </span>
                <span className="mini-stepper">
                  <span>-</span>
                  {draft.marksPerQuestion}
                  <span>+</span>
                </span>
                <span className="row-x">{active ? <X size={17} /> : <Plus size={17} />}</span>
              </button>
            );
          })}
        </div>
        {errors.questionTypes && <small className="field-error">{errors.questionTypes}</small>}

        <button className="add-type-button" type="button" onClick={addQuestionType}>
          <span>
            <Plus size={22} />
          </span>
          Add Question Type
        </button>

        <div className="metric-strip">
          <label className="metric-control">
            <span>
              <Hash size={16} />
              Questions
            </span>
            <input
              type="number"
              min={1}
              max={60}
              value={draft.numberOfQuestions}
              onChange={(event) => setField("numberOfQuestions", Number(event.target.value))}
            />
            {errors.numberOfQuestions && <small>{errors.numberOfQuestions}</small>}
          </label>

          <label className="metric-control">
            <span>
              <FileText size={16} />
              Marks each
            </span>
            <input
              type="number"
              min={1}
              max={25}
              value={draft.marksPerQuestion}
              onChange={(event) => setField("marksPerQuestion", Number(event.target.value))}
            />
            {errors.marksPerQuestion && <small>{errors.marksPerQuestion}</small>}
          </label>

          <label className="metric-control">
            <span>
              <Clock3 size={16} />
              Minutes
            </span>
            <input
              type="number"
              min={15}
              max={240}
              value={draft.durationMinutes}
              onChange={(event) => setField("durationMinutes", Number(event.target.value))}
            />
            {errors.durationMinutes && <small>{errors.durationMinutes}</small>}
          </label>
        </div>

        <section className="difficulty-card">
          <div className="section-heading inline">
            <h2>Difficulty Mix</h2>
            <span className={difficultyTotal === 100 ? "total-chip ok" : "total-chip"}>{difficultyTotal}%</span>
          </div>
          <div className="difficulty-stack">
            {difficultyKeys.map(([key, label]) => (
              <label className={`difficulty-row ${key}`} key={key}>
                <span>{label}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={draft.difficultyMix[key]}
                  onChange={(event) => setDifficulty(key, Number(event.target.value))}
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.difficultyMix[key]}
                  onChange={(event) => setDifficulty(key, Number(event.target.value))}
                />
              </label>
            ))}
          </div>
          {errors.difficultyMix && <small className="field-error">{errors.difficultyMix}</small>}
        </section>

        <div className="form-totals">
          <span>Total Questions : {draft.numberOfQuestions || 0}</span>
          <span>Total Marks : {Number.isFinite(totalMarks) ? totalMarks : 0}</span>
        </div>

        <label className="field source-text">
          <span>
            <MessageSquareText size={16} />
            Additional Information (For better output)
          </span>
          <textarea
            value={draft.instructions}
            onChange={(event) => setField("instructions", event.target.value)}
            rows={4}
            placeholder="e.g Generate a question paper for 3 hour exam duration..."
          />
          <Mic className="mic-icon" size={18} />
          {errors.instructions && <small>{errors.instructions}</small>}
        </label>

        <label className="field source-text">
          <span>
            <Paperclip size={16} />
            Source notes
          </span>
          <textarea
            value={draft.sourceText}
            onChange={(event) => setField("sourceText", event.target.value)}
            rows={4}
            placeholder="Paste chapter notes, learning objectives, or rubric details."
          />
          {errors.sourceText && <small>{errors.sourceText}</small>}
        </label>
      </section>

      {serverError && <p className="server-error">{serverError}</p>}

      <div className="wizard-actions">
        <button className="secondary-action" type="button">
          <ArrowLeft size={18} />
          Previous
        </button>
        <button className="primary-action" disabled={isSubmitting} type="submit">
          {isSubmitting ? <LoaderCircle className="spin" size={18} /> : "Next"}
          <ArrowRight size={18} />
        </button>
      </div>
    </form>
  );
}
