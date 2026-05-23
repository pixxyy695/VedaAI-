import { generateAssessment } from "../services/openaiGenerator.js";

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is required for the live OpenAI smoke test.");
  process.exit(1);
}

const assessment = await generateAssessment({
  title: "Photosynthesis Check",
  subject: "Science",
  grade: "Class 8",
  dueDate: "2026-05-30",
  durationMinutes: 45,
  questionTypes: ["multiple_choice", "short_answer", "long_answer"],
  numberOfQuestions: 6,
  marksPerQuestion: 4,
  difficultyMix: {
    easy: 30,
    medium: 50,
    hard: 20
  },
  instructions: "Include one real-world application question and avoid duplicate stems.",
  sourceText: "Photosynthesis uses sunlight, carbon dioxide, and water to produce glucose and oxygen. Chlorophyll in leaves captures light energy."
});

const questionCount = assessment.sections.reduce((sum, section) => sum + section.questions.length, 0);
const markSum = assessment.sections.reduce(
  (sum, section) => sum + section.questions.reduce((inner, question) => inner + question.marks, 0),
  0
);

console.log(JSON.stringify({
  title: assessment.title,
  sections: assessment.sections.map((section) => ({
    title: section.title,
    questions: section.questions.length
  })),
  questionCount,
  totalMarks: assessment.totalMarks,
  markSum
}, null, 2));
