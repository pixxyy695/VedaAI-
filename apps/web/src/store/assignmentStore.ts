"use client";

import { create } from "zustand";
import type { AssignmentRecord, AssignmentRequest, QuestionType } from "@vedai/shared";
import { assignmentRequestSchema } from "@vedai/shared";

const tomorrow = () => {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
};

export const defaultDraft: AssignmentRequest = {
  title: "Chapter Checkpoint",
  subject: "Science",
  grade: "Class 8",
  dueDate: tomorrow(),
  durationMinutes: 60,
  questionTypes: ["multiple_choice", "short_answer", "long_answer"],
  numberOfQuestions: 12,
  marksPerQuestion: 3,
  difficultyMix: {
    easy: 30,
    medium: 50,
    hard: 20
  },
  instructions: "Prioritize conceptual understanding and include at least two real-world application questions.",
  sourceText: ""
};

type FieldErrors = Record<string, string>;

type AssignmentState = {
  draft: AssignmentRequest;
  sourceFile: File | null;
  sourceFileName: string;
  errors: FieldErrors;
  isSubmitting: boolean;
  assignments: Record<string, AssignmentRecord>;
  setField: <K extends keyof AssignmentRequest>(field: K, value: AssignmentRequest[K]) => void;
  setDifficulty: (key: keyof AssignmentRequest["difficultyMix"], value: number) => void;
  toggleQuestionType: (type: QuestionType) => void;
  setSourceFile: (file: File | null) => void;
  validateDraft: () => AssignmentRequest | null;
  setSubmitting: (value: boolean) => void;
  upsertAssignment: (assignment: AssignmentRecord) => void;
  resetDraft: () => void;
};

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  draft: defaultDraft,
  sourceFile: null,
  sourceFileName: "",
  errors: {},
  isSubmitting: false,
  assignments: {},
  setField: (field, value) => set((state) => ({
    draft: {
      ...state.draft,
      [field]: value
    },
    errors: {
      ...state.errors,
      [field]: ""
    }
  })),
  setDifficulty: (key, value) => set((state) => ({
    draft: {
      ...state.draft,
      difficultyMix: {
        ...state.draft.difficultyMix,
        [key]: Number.isFinite(value) ? value : 0
      }
    },
    errors: {
      ...state.errors,
      difficultyMix: ""
    }
  })),
  toggleQuestionType: (type) => set((state) => {
    const exists = state.draft.questionTypes.includes(type);
    const questionTypes = exists
      ? state.draft.questionTypes.filter((item) => item !== type)
      : [...state.draft.questionTypes, type];

    return {
      draft: {
        ...state.draft,
        questionTypes
      },
      errors: {
        ...state.errors,
        questionTypes: ""
      }
    };
  }),
  setSourceFile: (file) => set({
    sourceFile: file,
    sourceFileName: file?.name ?? ""
  }),
  validateDraft: () => {
    const result = assignmentRequestSchema.safeParse(get().draft);
    if (result.success) {
      set({ errors: {} });
      return result.data;
    }

    const errors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0]?.toString() ?? "form";
      errors[key] = issue.message;
    }
    set({ errors });
    return null;
  },
  setSubmitting: (value) => set({ isSubmitting: value }),
  upsertAssignment: (assignment) => set((state) => ({
    assignments: {
      ...state.assignments,
      [assignment.id]: assignment
    }
  })),
  resetDraft: () => set({
    draft: {
      ...defaultDraft,
      dueDate: tomorrow()
    },
    sourceFile: null,
    sourceFileName: "",
    errors: {}
  })
}));
