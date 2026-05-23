import IORedis from "ioredis";
import { Queue } from "bullmq";
import { config } from "../config.js";

export const GENERATION_QUEUE = "assessment-generation";

type GenerationJobData = {
  assignmentId: string;
  reason: "create" | "regenerate";
};

let queue: Queue<GenerationJobData> | null = null;
let redisReady = false;
let memoryProcessor: ((assignmentId: string) => Promise<void>) | null = null;

export function createRedisConnection() {
  return new IORedis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
}

export async function initGenerationQueue() {
  if (config.useMemoryQueue) {
    redisReady = false;
    return { mode: "memory" };
  }

  const probe = new IORedis(config.redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });

  try {
    await probe.connect();
    await probe.ping();
    probe.disconnect();

    queue = new Queue<GenerationJobData>(GENERATION_QUEUE, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 1500
        }
      }
    });
    redisReady = true;
    return { mode: "bullmq" };
  } catch (error) {
    probe.disconnect();
    redisReady = false;
    console.warn("[queue] Redis unavailable, using in-process memory queue.");
    return { mode: "memory", error };
  }
}

export function setMemoryGenerationProcessor(processor: (assignmentId: string) => Promise<void>) {
  memoryProcessor = processor;
}

export async function enqueueGeneration(assignmentId: string, reason: GenerationJobData["reason"]) {
  if (redisReady && queue) {
    return queue.add("generate-assessment", { assignmentId, reason });
  }

  if (!memoryProcessor) {
    throw new Error("Generation queue is not available and no memory processor is registered.");
  }

  queueMicrotask(() => {
    memoryProcessor?.(assignmentId).catch((error) => {
      console.error("[queue] Memory generation failed", error);
    });
  });

  return { id: `memory-${assignmentId}`, name: "generate-assessment" };
}

export function isBullQueueReady() {
  return redisReady;
}

export async function closeGenerationQueue() {
  await queue?.close();
}
