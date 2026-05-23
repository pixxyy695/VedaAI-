import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { assignmentRequestSchema } from "@vedai/shared";
import { config } from "../config.js";
import { createAssignment, getAssignmentForOwner, listAssignmentsForOwner, resetAssignment } from "../db/repository.js";
import { publishAssignmentUpdated } from "../events/assignmentEvents.js";
import { enqueueGeneration } from "../jobs/generationQueue.js";
import { cacheAssignmentState, getCachedAssignmentState } from "../services/jobStateCache.js";
import { extractSourceText } from "../services/sourceExtractor.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

export const assignmentsRouter = Router();

assignmentsRouter.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.uploadLimitMb * 1024 * 1024
  }
});

const jsonField = <T>(value: unknown, fallback: T): T => {
  if (Array.isArray(value)) return value as T;
  if (typeof value !== "string" || value.trim() === "") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalizeCreateBody = async (body: Record<string, unknown>, file?: Express.Multer.File) => {
  const fileText = await extractSourceText(file);
  const sourceText = [typeof body.sourceText === "string" ? body.sourceText : "", fileText]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  return {
    title: body.title,
    subject: body.subject,
    grade: body.grade,
    dueDate: body.dueDate,
    durationMinutes: body.durationMinutes,
    questionTypes: jsonField(body.questionTypes, []),
    numberOfQuestions: body.numberOfQuestions,
    marksPerQuestion: body.marksPerQuestion,
    difficultyMix: jsonField(body.difficultyMix, { easy: 30, medium: 50, hard: 20 }),
    instructions: typeof body.instructions === "string" ? body.instructions : "",
    sourceText
  };
};

const applyDemoCostControls = (input: z.infer<typeof assignmentRequestSchema>) => ({
  ...input,
  numberOfQuestions: Math.min(input.numberOfQuestions, config.maxGenerationQuestions),
  sourceText: input.sourceText.slice(0, config.openAISourceTextLimit)
});

assignmentsRouter.get("/assignments", async (request, response, next) => {
  try {
    const { user } = request as unknown as AuthenticatedRequest;
    const assignments = await listAssignmentsForOwner(user.id);
    response.json({ assignments });
  } catch (error) {
    next(error);
  }
});

assignmentsRouter.post("/assignments", upload.single("sourceFile"), async (request, response, next) => {
  try {
    const { user } = request as unknown as AuthenticatedRequest;
    const normalized = await normalizeCreateBody(request.body, request.file);
    const parsed = assignmentRequestSchema.safeParse(normalized);

    if (!parsed.success) {
      response.status(422).json({
        error: "Validation failed",
        issues: z.flattenError(parsed.error).fieldErrors
      });
      return;
    }

    const assignment = await createAssignment(applyDemoCostControls(parsed.data), user.id);
    await cacheAssignmentState(assignment);
    await publishAssignmentUpdated(assignment);
    await enqueueGeneration(assignment.id, "create");

    response.status(202).json({ assignment });
  } catch (error) {
    next(error);
  }
});

assignmentsRouter.get("/assignments/:id", async (request, response, next) => {
  try {
    const { user } = request as unknown as AuthenticatedRequest;
    const cached = await getCachedAssignmentState(request.params.id);
    const assignment = cached?.ownerId === user.id ? cached : await getAssignmentForOwner(request.params.id, user.id);

    if (!assignment) {
      response.status(404).json({ error: "Assignment not found" });
      return;
    }

    response.json({ assignment });
  } catch (error) {
    next(error);
  }
});

assignmentsRouter.post("/assignments/:id/regenerate", async (request, response, next) => {
  try {
    const { user } = request as unknown as AuthenticatedRequest;
    const existing = await getAssignmentForOwner(request.params.id, user.id);
    if (!existing) {
      response.status(404).json({ error: "Assignment not found" });
      return;
    }

    const assignment = await resetAssignment(request.params.id);
    if (!assignment) {
      response.status(404).json({ error: "Assignment not found" });
      return;
    }

    await cacheAssignmentState(assignment);
    await publishAssignmentUpdated(assignment);
    await enqueueGeneration(assignment.id, "regenerate");
    response.status(202).json({ assignment });
  } catch (error) {
    next(error);
  }
});
