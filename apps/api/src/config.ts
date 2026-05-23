import "dotenv/config";

const envFlag = (value: string | undefined) => value === "true" || value === "1";
const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, "");
const envList = (value: string | undefined, fallback: string) =>
  (value ?? fallback)
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

export const config = {
  port: Number(process.env.PORT ?? 4000),
  webOrigins: envList(process.env.WEB_ORIGIN, "http://localhost:3000"),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/vedai",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  openAIKey: process.env.OPENAI_API_KEY ?? "",
  openAIModel: process.env.OPENAI_MODEL ?? "gpt-5-nano",
  openAIMaxOutputTokens: Number(process.env.OPENAI_MAX_OUTPUT_TOKENS ?? 2500),
  openAISourceTextLimit: Number(process.env.OPENAI_SOURCE_TEXT_LIMIT ?? 3500),
  maxGenerationQuestions: Number(process.env.MAX_GENERATION_QUESTIONS ?? 12),
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-change-me",
  cookieSecure: envFlag(process.env.COOKIE_SECURE) || process.env.NODE_ENV === "production",
  runWorkerInApi: envFlag(process.env.RUN_WORKER_IN_API),
  useMemoryDb: envFlag(process.env.USE_MEMORY_DB),
  useMemoryQueue: envFlag(process.env.USE_MEMORY_QUEUE),
  uploadLimitMb: Number(process.env.UPLOAD_LIMIT_MB ?? 8)
};

export const isProduction = process.env.NODE_ENV === "production";
