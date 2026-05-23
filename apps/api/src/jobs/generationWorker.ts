import { Worker } from "bullmq";
import { createRedisConnection, GENERATION_QUEUE } from "./generationQueue.js";
import { processGeneration } from "../services/generationService.js";

export function createGenerationWorker() {
  const worker = new Worker(
    GENERATION_QUEUE,
    async (job) => {
      await processGeneration(job.data.assignmentId);
    },
    {
      connection: createRedisConnection(),
      concurrency: 1
    }
  );

  worker.on("completed", (job) => console.log(`[worker] completed ${job.id}`));
  worker.on("failed", (job, error) => console.error(`[worker] failed ${job?.id}`, error));

  return worker;
}
