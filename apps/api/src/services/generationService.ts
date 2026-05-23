import { generatedAssessmentSchema } from "@vedai/shared";
import { getAssignment, updateAssignment } from "../db/repository.js";
import { publishAssignmentUpdated } from "../events/assignmentEvents.js";
import { cacheAssignmentState } from "./jobStateCache.js";
import { generateAssessment } from "./openaiGenerator.js";
import { normalizeGeneratedAssessment } from "./assessmentFormatter.js";
import { sleep } from "../utils/sleep.js";

async function updateAndPublish(
  id: string,
  patch: Parameters<typeof updateAssignment>[1],
  delayMs = 220
) {
  const updated = await updateAssignment(id, patch);
  if (!updated) throw new Error(`Assignment ${id} was not found.`);
  await cacheAssignmentState(updated);
  await publishAssignmentUpdated(updated);
  if (delayMs > 0) await sleep(delayMs);
  return updated;
}

export async function processGeneration(assignmentId: string) {
  const assignment = await getAssignment(assignmentId);
  if (!assignment) {
    throw new Error(`Assignment ${assignmentId} was not found.`);
  }

  try {
    await updateAndPublish(assignmentId, {
      status: assignment.input.sourceText ? "reading_source" : "prompting",
      progress: 18,
      statusMessage: assignment.input.sourceText ? "Reading uploaded source material" : "Preparing generation prompt",
      error: null
    });

    await updateAndPublish(assignmentId, {
      status: "prompting",
      progress: 34,
      statusMessage: "Converting assignment settings into a structured prompt"
    });

    await updateAndPublish(assignmentId, {
      status: "generating",
      progress: 58,
      statusMessage: "Generating assessment with OpenAI"
    }, 0);

    const result = normalizeGeneratedAssessment(
      assignment.input,
      generatedAssessmentSchema.parse(await generateAssessment(assignment.input))
    );

    await updateAndPublish(assignmentId, {
      status: "structuring",
      progress: 84,
      statusMessage: "Validating sections, marks, and difficulty tags",
      result
    });

    await updateAndPublish(assignmentId, {
      status: "completed",
      progress: 100,
      statusMessage: "Question paper is ready",
      result,
      error: null
    }, 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    await updateAndPublish(assignmentId, {
      status: "failed",
      progress: 100,
      statusMessage: "Generation failed",
      error: message
    }, 0);
  }
}
