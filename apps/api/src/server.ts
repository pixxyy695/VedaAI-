import http from "node:http";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { config } from "./config.js";
import { initRepository, closeRepository } from "./db/repository.js";
import { initAssignmentEventBus, closeAssignmentEventBus, setAssignmentBroadcaster } from "./events/assignmentEvents.js";
import { attachWebSocketServer } from "./events/websocket.js";
import { closeGenerationQueue, initGenerationQueue, setMemoryGenerationProcessor } from "./jobs/generationQueue.js";
import { createGenerationWorker } from "./jobs/generationWorker.js";
import { assignmentsRouter } from "./routes/assignments.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { processGeneration } from "./services/generationService.js";
import { closeJobStateCache, initJobStateCache } from "./services/jobStateCache.js";

const app = express();
const server = http.createServer(app);
const ws = attachWebSocketServer(server);
let inApiWorker: ReturnType<typeof createGenerationWorker> | null = null;

setAssignmentBroadcaster(ws.broadcast);

app.use(cors({
  origin(origin, callback) {
    if (!origin || config.webOrigins.includes(origin.replace(/\/+$/, ""))) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  },
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api", healthRouter);
app.use("/api", authRouter);
app.use("/api", assignmentsRouter);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  const status = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
    ? error.status
    : 500;
  console.error("[api]", error);
  response.status(status).json({ error: message });
});

async function start() {
  const db = await initRepository();
  const cache = await initJobStateCache();
  const events = await initAssignmentEventBus();
  const queue = await initGenerationQueue();

  if (queue.mode === "memory") {
    setMemoryGenerationProcessor(processGeneration);
  } else if (config.runWorkerInApi) {
    inApiWorker = createGenerationWorker();
  }

  server.listen(config.port, () => {
    console.log(`[api] listening on http://localhost:${config.port}`);
    console.log(`[api] db=${db.mode} cache=${cache.mode} events=${events.mode} queue=${queue.mode} worker=${inApiWorker ? "in-api" : "external"}`);
  });
}

async function shutdown() {
  ws.close();
  await inApiWorker?.close();
  await closeGenerationQueue();
  await closeAssignmentEventBus();
  await closeJobStateCache();
  await closeRepository();
  server.close();
}

process.on("SIGINT", () => shutdown().finally(() => process.exit(0)));
process.on("SIGTERM", () => shutdown().finally(() => process.exit(0)));

start().catch((error) => {
  console.error("[api] failed to start", error);
  process.exit(1);
});
