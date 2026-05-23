import IORedis from "ioredis";
import type { AssignmentRecord } from "@vedai/shared";
import { assignmentRecordSchema } from "@vedai/shared";
import { config } from "../config.js";

let cache: IORedis | null = null;

export async function initJobStateCache() {
  if (config.useMemoryQueue) return { mode: "disabled" };

  try {
    const client = new IORedis(config.redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
    await client.connect();
    await client.ping();
    cache = client;
    return { mode: "redis" };
  } catch (error) {
    cache?.disconnect();
    cache = null;
    console.warn("[cache] Redis cache unavailable; job state will come from repository.");
    return { mode: "disabled", error };
  }
}

export async function cacheAssignmentState(assignment: AssignmentRecord) {
  if (!cache) return;
  await cache.set(`assignment:${assignment.id}`, JSON.stringify(assignment), "EX", 60 * 30);
}

export async function getCachedAssignmentState(id: string): Promise<AssignmentRecord | null> {
  if (!cache) return null;
  const payload = await cache.get(`assignment:${id}`);
  if (!payload) return null;
  try {
    return assignmentRecordSchema.parse(JSON.parse(payload));
  } catch {
    return null;
  }
}

export async function closeJobStateCache() {
  cache?.disconnect();
}
