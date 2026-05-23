import type { AssignmentRequest, Difficulty, GeneratedAssessment, GeneratedQuestion, GeneratedSection } from "@vedai/shared";
import { generatedAssessmentSchema } from "@vedai/shared";
import { generateFallbackAssessment } from "./fallbackGenerator.js";

const sectionMeta: Record<Difficulty, Omit<GeneratedSection, "questions">> = {
  easy: {
    id: "section-a",
    title: "Section A - Foundations",
    instruction: "Attempt all questions. Keep answers precise."
  },
  medium: {
    id: "section-b",
    title: "Section B - Application",
    instruction: "Attempt all questions with steps, reasons, or examples where relevant."
  },
  hard: {
    id: "section-c",
    title: "Section C - Reasoning",
    instruction: "Attempt all questions. Support answers with evidence and clear justification."
  }
};

function fallbackQuestions(input: AssignmentRequest) {
  return generateFallbackAssessment(input).sections.flatMap((section) => section.questions);
}

function questionWithDefaults(
  question: GeneratedQuestion,
  index: number,
  input: AssignmentRequest
): GeneratedQuestion {
  return {
    id: question.id?.trim() || `q-${index + 1}`,
    text: question.text.trim(),
    type: input.questionTypes.includes(question.type) ? question.type : input.questionTypes[index % input.questionTypes.length] ?? "short_answer",
    difficulty: question.difficulty,
    marks: input.marksPerQuestion,
    skill: question.skill.trim() || "Subject understanding",
    answerGuide: question.answerGuide.trim() || "Award full marks for an accurate, complete response with relevant examples."
  };
}

function groupedSections(questions: GeneratedQuestion[]): GeneratedSection[] {
  return (["easy", "medium", "hard"] as const)
    .map((difficulty) => ({
      ...sectionMeta[difficulty],
      questions: questions.filter((question) => question.difficulty === difficulty)
    }))
    .filter((section) => section.questions.length > 0);
}

export function normalizeGeneratedAssessment(
  input: AssignmentRequest,
  candidate: GeneratedAssessment
): GeneratedAssessment {
  const parsed = generatedAssessmentSchema.safeParse(candidate);
  if (!parsed.success) {
    return generateFallbackAssessment(input);
  }

  const expectedCount = input.numberOfQuestions;
  const expectedMarks = expectedCount * input.marksPerQuestion;
  const fallbackPool = fallbackQuestions(input);
  const rawQuestions = parsed.data.sections.flatMap((section) => section.questions);
  const usableQuestions = rawQuestions.filter((question) => question.text.trim().length > 0);

  while (usableQuestions.length < expectedCount) {
    const fallback = fallbackPool[usableQuestions.length % fallbackPool.length];
    if (!fallback) break;
    usableQuestions.push(fallback);
  }

  const questions = usableQuestions
    .slice(0, expectedCount)
    .map((question, index) => questionWithDefaults(question, index, input));

  return generatedAssessmentSchema.parse({
    title: input.title,
    subject: input.subject,
    grade: input.grade,
    durationMinutes: input.durationMinutes,
    totalMarks: expectedMarks,
    blueprint: parsed.data.blueprint.trim() || `Generated from ${expectedCount} question(s) at ${input.marksPerQuestion} mark(s) each.`,
    sections: groupedSections(questions)
  });
}
