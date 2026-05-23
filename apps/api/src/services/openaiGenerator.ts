import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { AssignmentRequest, GeneratedAssessment } from "@vedai/shared";
import { generatedAssessmentSchema } from "@vedai/shared";
import { config } from "../config.js";
import { buildAssessmentPrompt } from "./promptBuilder.js";
import { generateFallbackAssessment } from "./fallbackGenerator.js";
import { normalizeGeneratedAssessment } from "./assessmentFormatter.js";

export async function generateAssessment(input: AssignmentRequest): Promise<GeneratedAssessment> {
  if (!config.openAIKey) {
    return generateFallbackAssessment(input);
  }

  const openai = new OpenAI({ apiKey: config.openAIKey });

  try {
    const response = await openai.responses.parse({
      model: config.openAIModel,
      input: [
        {
          role: "developer",
          content: [
            "You are an expert assessment designer for school teachers.",
            "Return only data that matches the supplied schema.",
            "Use fair, age-appropriate language and never include private student data."
          ].join(" ")
        },
        {
          role: "user",
          content: buildAssessmentPrompt(input)
        }
      ],
      max_output_tokens: config.openAIMaxOutputTokens,
      text: {
        format: zodTextFormat(generatedAssessmentSchema, "generated_assessment")
      }
    });

    return normalizeGeneratedAssessment(input, generatedAssessmentSchema.parse(response.output_parsed));
  } catch (error) {
    console.warn("[openai] Structured generation failed; using deterministic fallback.", error);
    return generateFallbackAssessment(input);
  }
}
