import { Router } from "express";
import { isBullQueueReady } from "../jobs/generationQueue.js";

export const healthRouter = Router();

healthRouter.get("/health", (_request, response) => {
  response.json({
    ok: true,
    queue: isBullQueueReady() ? "bullmq" : "memory"
  });
});
