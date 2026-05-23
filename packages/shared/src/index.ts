import { z } from "zod";

export const questionTypeSchema = z.enum([
  "multiple_choice",
  "short_answer",
  "long_answer",
  "case_study",
  "true_false"
]);

export const difficultySchema = z.enum(["easy", "medium", "hard"]);

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  createdAt: z.string()
});

export const registerRequestSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.email("Enter a valid email address.").transform((email) => email.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const loginRequestSchema = z.object({
  email: z.email("Enter a valid email address.").transform((email) => email.toLowerCase()),
  password: z.string().min(1, "Password is required.")
});

export const authSessionSchema = z.object({
  user: userSchema,
  token: z.string()
});

export const assignmentRequestSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters."),
  subject: z.string().trim().min(2, "Subject is required."),
  grade: z.string().trim().min(1, "Grade or class is required."),
  dueDate: z.string().trim().min(1, "Due date is required."),
  durationMinutes: z.coerce.number().int().min(15).max(240),
  questionTypes: z.array(questionTypeSchema).min(1, "Choose at least one question type."),
  numberOfQuestions: z.coerce.number().int().min(1).max(60),
  marksPerQuestion: z.coerce.number().int().min(1).max(25),
  difficultyMix: z.object({
    easy: z.coerce.number().int().min(0).max(100),
    medium: z.coerce.number().int().min(0).max(100),
    hard: z.coerce.number().int().min(0).max(100)
  }),
  instructions: z.string().trim().max(1200).default(""),
  sourceText: z.string().trim().max(12000).default("")
}).superRefine((value, ctx) => {
  const total = value.difficultyMix.easy + value.difficultyMix.medium + value.difficultyMix.hard;

  if (total !== 100) {
    ctx.addIssue({
      code: "custom",
      message: "Difficulty mix must add up to 100%.",
      path: ["difficultyMix"]
    });
  }

  const due = Date.parse(value.dueDate);
  if (Number.isNaN(due)) {
    ctx.addIssue({
      code: "custom",
      message: "Due date must be valid.",
      path: ["dueDate"]
    });
  }
});

export const generationStatusSchema = z.enum([
  "queued",
  "reading_source",
  "prompting",
  "generating",
  "structuring",
  "completed",
  "failed"
]);

export const generatedQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: questionTypeSchema,
  difficulty: difficultySchema,
  marks: z.number().int().positive(),
  skill: z.string(),
  answerGuide: z.string()
});

export const generatedSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  instruction: z.string(),
  questions: z.array(generatedQuestionSchema).min(1)
});

export const generatedAssessmentSchema = z.object({
  title: z.string(),
  subject: z.string(),
  grade: z.string(),
  durationMinutes: z.number().int().positive(),
  totalMarks: z.number().int().positive(),
  blueprint: z.string(),
  sections: z.array(generatedSectionSchema).min(1)
});

export const assignmentRecordSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  input: assignmentRequestSchema,
  status: generationStatusSchema,
  progress: z.number().int().min(0).max(100),
  statusMessage: z.string(),
  result: generatedAssessmentSchema.nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const websocketEventSchema = z.object({
  type: z.enum(["assignment.updated", "assignment.failed", "assignment.completed", "subscribed"]),
  assignmentId: z.string(),
  assignment: assignmentRecordSchema.optional(),
  message: z.string().optional()
});

export type QuestionType = z.infer<typeof questionTypeSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type User = z.infer<typeof userSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type AssignmentRequest = z.infer<typeof assignmentRequestSchema>;
export type GenerationStatus = z.infer<typeof generationStatusSchema>;
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GeneratedSection = z.infer<typeof generatedSectionSchema>;
export type GeneratedAssessment = z.infer<typeof generatedAssessmentSchema>;
export type AssignmentRecord = z.infer<typeof assignmentRecordSchema>;
export type WebsocketEvent = z.infer<typeof websocketEventSchema>;

export const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: "Multiple choice",
  short_answer: "Short answer",
  long_answer: "Long answer",
  case_study: "Case study",
  true_false: "True / false"
};
