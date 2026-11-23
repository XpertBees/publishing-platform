import "dotenv/config";
import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import yaml from "yamljs";
import { sequelize } from "./config/database";
import "./models";
import apiRoutes from "./routes";
import { AffiliatesController } from "./controllers/content.controller";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiRateLimit } from "./middleware/rateLimit";
import { requestLogger } from "./middleware/requestLogger";
import { uploadDir } from "./services/media.service";
import { closeRssQueue } from "./queues/rss.queue";
import { closeCleanupWorker, startCleanupWorker } from "./jobs/cleanup";
import { closeRssWorker, startRssWorker } from "./jobs/rss.job";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

/** Locate docs/openapi.yaml (repo root docs/) from src/ or dist/. */
function loadOpenApiSpec(): Record<string, unknown> | null {
  const candidates = [
    // From src/server.ts: apps/api/src → repo docs.
    path.resolve(__dirname, "../../docs/openapi.yaml"),
    // From dist/server.js (or the bundle): apps/api/dist → repo docs.
    path.resolve(__dirname, "../../../docs/openapi.yaml"),
    // From the repo root or apps/api as working directory.
    path.resolve(process.cwd(), "docs/openapi.yaml"),
    path.resolve(process.cwd(), "../../docs/openapi.yaml"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return yaml.load(candidate) as Record<string, unknown>;
    }
  }
  return null;
}

app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin: process.env.WEB_BASE_URL ?? "http://localhost:3000",
  }),
);
app.use(requestLogger());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimit);

// Uploaded files (local disk in dev) served under /uploads.
app.use("/uploads", express.static(uploadDir()));

// Affiliate short links: GET /go/:slug → 302 (outside /api/v1).
app.get("/go/:slug", AffiliatesController.go);

// Swagger UI for the OpenAPI spec.
const openApiSpec = loadOpenApiSpec();
if (openApiSpec) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
} else {
  // eslint-disable-next-line no-console
  console.warn("[api] docs/openapi.yaml not found — /api-docs disabled.");
}

app.use("/api/v1", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function startWorkers(): Promise<void> {
  if (process.env.DISABLE_WORKERS === "true") {
    // eslint-disable-next-line no-console
    console.log("[api] workers disabled (DISABLE_WORKERS=true).");
    return;
  }
  try {
    await startRssWorker();
    await startCleanupWorker();
  } catch (err) {
    // Redis down must not take the HTTP API with it.
    // eslint-disable-next-line no-console
    console.error(
      "[api] workers failed to start (Redis unavailable?) — API continues without them.",
      err,
    );
  }
}

async function shutdown(signal: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`[api] ${signal} received — shutting down gracefully.`);
  server.close(async () => {
    try {
      await closeRssWorker();
      await closeCleanupWorker();
      await closeRssQueue();
      await sequelize.close();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[api] error during shutdown", err);
    }
    process.exit(0);
  });
  // Force-exit if connections hang.
  setTimeout(() => process.exit(1), 10_000).unref();
}

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `The Daily Pulse API listening on :${PORT} (env: ${process.env.NODE_ENV ?? "development"})`,
  );
  void startWorkers();
});

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

export default app;
