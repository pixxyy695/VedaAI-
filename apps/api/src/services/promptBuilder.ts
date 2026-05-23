import type { AssignmentRequest } from "@vedai/shared";
import { questionTypeLabels } from "@vedai/shared";
import { config } from "../config.js";

export function buildAssessmentPrompt(input: AssignmentRequest) {
  const sourceBlock = input.sourceText
    ? `\n\nSOURCE MATERIAL TO USE:\n${input.sourceText.slice(0, config.openAISourceTextLimit)}`
    : "\n\nSOURCE MATERIAL TO USE:\nNo uploaded source was supplied. Create curriculum-appropriate questions from the assignment details.";

  return [
    "Create a classroom-ready question paper as structured data only.",
    "",
    "Assignment details:",
    `- Title: ${input.title}`,
    `- Subject: ${input.subject}`,
    `- Grade/Class: ${input.grade}`,
    `- Due date: ${input.dueDate}`,
    `- Duration: ${input.durationMinutes} minutes`,
    `- Number of questions: ${input.numberOfQuestions}`,
    `- Marks per question: ${input.marksPerQuestion}`,
    `- Question types: ${input.questionTypes.map((type) => questionTypeLabels[type]).join(", ")}`,
    `- Difficulty mix: easy ${input.difficultyMix.easy}%, medium ${input.difficultyMix.medium}%, hard ${input.difficultyMix.hard}%`,
    `- Teacher instructions: ${input.instructions || "No extra instructions."}`,
    "",
    "Required formatting rules:",
    `- Generate exactly ${input.numberOfQuestions} questions.`,
    `- Give every question exactly ${input.marksPerQuestion} mark(s).`,
    `- Set totalMarks to exactly ${input.numberOfQuestions * input.marksPerQuestion}.`,
    "- Group questions into Section A, Section B, and Section C when the count allows.",
    "- Use a mix of recall, application, and reasoning tasks.",
    "- Every question must include a difficulty, marks, question type, skill, and concise teacher answer guide.",
    "- Do not duplicate question text.",
    "- Prefer the uploaded/pasted source topics over generic title words.",
    "- Avoid mentioning that an AI generated this paper.",
    sourceBlock
  ].join("\n");
}
