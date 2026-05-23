import crypto from "node:crypto";
import type { AssignmentRequest, Difficulty, GeneratedAssessment, GeneratedQuestion, QuestionType } from "@vedai/shared";

const easyStarters: Record<QuestionType, string[]> = {
  multiple_choice: [
    "Choose the correct option that best defines",
    "Identify the most accurate statement about",
    "Select the example that correctly represents"
  ],
  short_answer: [
    "State two key features of",
    "Define the term and give one example:",
    "Explain in two or three sentences"
  ],
  long_answer: [
    "Describe the main ideas behind",
    "Explain the process and include a suitable example for",
    "Write a clear note on"
  ],
  case_study: [
    "Read the classroom scenario and identify the principle involved in",
    "Use a simple real-life situation to show your understanding of",
    "Apply the idea to a familiar school context:"
  ],
  true_false: [
    "Write True or False and justify in one line:",
    "Decide whether the statement is correct and correct it if needed:",
    "Mark the statement as True or False:"
  ]
};

const mediumStarters: Record<QuestionType, string[]> = {
  multiple_choice: [
    "Choose the option that best explains the relationship between",
    "Which conclusion follows from the given situation involving",
    "Select the option that would most likely improve"
  ],
  short_answer: [
    "Compare two ways of approaching",
    "Give reasons for the importance of",
    "Summarize the cause and effect relationship in"
  ],
  long_answer: [
    "Analyze how the parts of the topic work together in",
    "Discuss the advantages and limitations of",
    "Explain the concept with a labelled sequence or structured example:"
  ],
  case_study: [
    "A student observes an unexpected result. Explain what may be happening in",
    "A school team must solve a problem related to",
    "Interpret the case and recommend a response for"
  ],
  true_false: [
    "Write True or False, then support your choice with evidence:",
    "Evaluate the statement and explain the misconception if any:",
    "Decide whether this claim is valid:"
  ]
};

const hardStarters: Record<QuestionType, string[]> = {
  multiple_choice: [
    "Choose the strongest inference after evaluating the evidence about",
    "Which option would be the best counterexample to",
    "Select the most defensible explanation for a complex situation involving"
  ],
  short_answer: [
    "Justify a decision using evidence from",
    "Propose an improvement and explain the trade-off in",
    "Evaluate the claim and mention one limitation:"
  ],
  long_answer: [
    "Design a solution, defend your reasoning, and predict possible challenges for",
    "Critically examine the statement with examples and counterexamples:",
    "Synthesize the ideas into a coherent argument about"
  ],
  case_study: [
    "A community faces a layered problem. Diagnose the issue and propose a plan for",
    "Study the case, identify competing priorities, and justify a decision about",
    "Create a response strategy for the situation described by"
  ],
  true_false: [
    "Judge the statement, then rewrite it to make it fully accurate:",
    "Assess the truth of the statement under two different conditions:",
    "Evaluate whether the claim is always true, sometimes true, or false:"
  ]
};

function extractTopics(input: AssignmentRequest) {
  const base = `${input.title} ${input.subject} ${input.instructions} ${input.sourceText}`.toLowerCase();
  const words = base
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4 && !["about", "their", "there", "which", "would", "could", "should", "using", "source", "material"].includes(word));

  const unique = [...new Set(words)].slice(0, 12);
  return unique.length >= 4
    ? unique
    : [input.subject, input.title, "core concepts", "real-world application", "evidence", "reasoning"];
}

function distributeDifficulties(input: AssignmentRequest): Difficulty[] {
  const total = input.numberOfQuestions;
  const raw = {
    easy: (total * input.difficultyMix.easy) / 100,
    medium: (total * input.difficultyMix.medium) / 100,
    hard: (total * input.difficultyMix.hard) / 100
  };

  const counts = {
    easy: Math.floor(raw.easy),
    medium: Math.floor(raw.medium),
    hard: Math.floor(raw.hard)
  };

  let remaining = total - counts.easy - counts.medium - counts.hard;
  const order = (["easy", "medium", "hard"] as Difficulty[])
    .sort((a, b) => (raw[b] - Math.floor(raw[b])) - (raw[a] - Math.floor(raw[a])));

  for (const difficulty of order) {
    if (remaining <= 0) break;
    counts[difficulty] += 1;
    remaining -= 1;
  }

  return [
    ...Array.from({ length: counts.easy }, () => "easy" as const),
    ...Array.from({ length: counts.medium }, () => "medium" as const),
    ...Array.from({ length: counts.hard }, () => "hard" as const)
  ];
}

function sectionForDifficulty(difficulty: Difficulty) {
  if (difficulty === "easy") {
    return {
      id: "section-a",
      title: "Section A - Foundations",
      instruction: "Attempt all questions. Keep answers precise."
    };
  }

  if (difficulty === "medium") {
    return {
      id: "section-b",
      title: "Section B - Application",
      instruction: "Attempt all questions with steps, reasons, or examples where relevant."
    };
  }

  return {
    id: "section-c",
    title: "Section C - Reasoning",
    instruction: "Attempt all questions. Support answers with evidence and clear justification."
  };
}

function starterFor(type: QuestionType, difficulty: Difficulty, index: number) {
  const table = difficulty === "easy" ? easyStarters : difficulty === "medium" ? mediumStarters : hardStarters;
  const options = table[type];
  return options[index % options.length] ?? options[0];
}

export function generateFallbackAssessment(input: AssignmentRequest): GeneratedAssessment {
  const topics = extractTopics(input);
  const difficulties = distributeDifficulties(input);
  const sections = new Map<string, ReturnType<typeof sectionForDifficulty> & { questions: GeneratedQuestion[] }>();

  difficulties.forEach((difficulty, index) => {
    const type = input.questionTypes[index % input.questionTypes.length] ?? "short_answer";
    const topic = topics[index % topics.length] ?? input.subject;
    const sectionMeta = sectionForDifficulty(difficulty);
    const existing = sections.get(sectionMeta.id) ?? { ...sectionMeta, questions: [] };
    const id = `q-${index + 1}-${crypto.randomBytes(2).toString("hex")}`;

    existing.questions.push({
      id,
      text: `${starterFor(type, difficulty, index)} ${topic}.`,
      type,
      difficulty,
      marks: input.marksPerQuestion,
      skill: difficulty === "easy" ? "Recall and clarity" : difficulty === "medium" ? "Application and connection" : "Evaluation and transfer",
      answerGuide: "Award full marks for a complete, accurate response that uses subject vocabulary and relevant examples."
    });

    sections.set(sectionMeta.id, existing);
  });

  return {
    title: input.title,
    subject: input.subject,
    grade: input.grade,
    durationMinutes: input.durationMinutes,
    totalMarks: input.numberOfQuestions * input.marksPerQuestion,
    blueprint: `Generated with a ${input.difficultyMix.easy}/${input.difficultyMix.medium}/${input.difficultyMix.hard} difficulty split across ${input.questionTypes.length} selected question type(s).`,
    sections: [...sections.values()]
  };
}
