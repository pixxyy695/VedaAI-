import { initRepository, closeRepository } from "./db/repository.js";
import { closeAssignmentEventBus, initAssignmentEventBus } from "./events/assignmentEvents.js";
import { initGenerationQueue } from "./jobs/generationQueue.js";
import { createGenerationWorker } from "./jobs/generationWorker.js";
import { closeJobStateCache, initJobStateCache } from "./services/jobStateCache.js";

let worker: ReturnType<typeof createGenerationWorker> | null = null;

async function start() {
  const db = await initRepository();
  const cache = await initJobStateCache();
  const events = await initAssignmentEventBus();
  const queue = await initGenerationQueue();

  if (queue.mode !== "bullmq") {
    console.log("[worker] Redis/BullMQ unavailable; API process will handle memory jobs.");
    return;
  }

  worker = createGenerationWorker();
  console.log(`[worker] ready db=${db.mode} cache=${cache.mode} events=${events.mode}`);
}

async function shutdown() {
  await worker?.close();
  await closeAssignmentEventBus();
  await closeJobStateCache();
  await closeRepository();
}

process.on("SIGINT", () => shutdown().finally(() => process.exit(0)));
process.on("SIGTERM", () => shutdown().finally(() => process.exit(0)));

start().catch((error) => {
  console.error("[worker] failed to start", error);
  process.exit(1);
});
