import IORedis from "ioredis";
import type { AssignmentRecord, WebsocketEvent } from "@vedai/shared";
import { websocketEventSchema } from "@vedai/shared";
import { config } from "../config.js";

const CHANNEL = "vedai:assignment-events";

let publisher: IORedis | null = null;
let subscriber: IORedis | null = null;
let broadcastLocal: ((event: WebsocketEvent) => void) | null = null;

export function setAssignmentBroadcaster(handler: (event: WebsocketEvent) => void) {
  broadcastLocal = handler;
}

export async function initAssignmentEventBus() {
  if (config.useMemoryQueue) return { mode: "local" };

  try {
    const pub = new IORedis(config.redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
    const sub = new IORedis(config.redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });
    await pub.connect();
    await sub.connect();
    await pub.ping();
    await sub.subscribe(CHANNEL);

    sub.on("message", (_channel, message) => {
      try {
        const event = websocketEventSchema.parse(JSON.parse(message));
        broadcastLocal?.(event);
      } catch (error) {
        console.warn("[events] Ignored malformed event", error);
      }
    });

    publisher = pub;
    subscriber = sub;
    return { mode: "redis" };
  } catch (error) {
    publisher?.disconnect();
    subscriber?.disconnect();
    publisher = null;
    subscriber = null;
    console.warn("[events] Redis pub/sub unavailable, using local events.");
    return { mode: "local", error };
  }
}

export async function publishAssignmentUpdated(assignment: AssignmentRecord) {
  const type = assignment.status === "completed"
    ? "assignment.completed"
    : assignment.status === "failed"
      ? "assignment.failed"
      : "assignment.updated";

  const event: WebsocketEvent = {
    type,
    assignmentId: assignment.id,
    assignment,
    message: assignment.statusMessage
  };

  broadcastLocal?.(event);

  if (publisher) {
    await publisher.publish(CHANNEL, JSON.stringify(event));
  }
}

export async function closeAssignmentEventBus() {
  publisher?.disconnect();
  subscriber?.disconnect();
}
