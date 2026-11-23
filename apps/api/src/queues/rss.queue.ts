import { Queue } from "bullmq";
import IORedis from "ioredis";
import type { RssFetchJobData } from "../jobs/rss.job";

export const RSS_QUEUE_NAME = "rss-ingest";

let connection: IORedis | null = null;
let queue: Queue<RssFetchJobData> | null = null;

/** Shared ioredis connection (BullMQ requires maxRetriesPerRequest: null). */
export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

export function getRssQueue(): Queue<RssFetchJobData> {
  if (!queue) {
    queue = new Queue<RssFetchJobData>(RSS_QUEUE_NAME, { connection: getRedisConnection() });
  }
  return queue;
}

/** Enqueue a one-off fetch for a single source. */
export async function enqueueRssFetch(sourceId: string): Promise<{ id: string | undefined }> {
  const job = await getRssQueue().add("fetch-source", { sourceId });
  return { id: job.id?.toString() };
}

/**
 * (Re)register a repeatable job per active source, keyed by source id so
 * re-registering after a restart or interval change replaces the old one.
 * Each source polls on its own fetchIntervalMinutes (default 15).
 */
export async function scheduleRssJobs(
  sources: { fetchIntervalMinutes: number; id: string }[],
): Promise<void> {
  const q = getRssQueue();
  for (const source of sources) {
    const minutes = source.fetchIntervalMinutes || 15;
    await q.upsertJobScheduler(
      `rss-${source.id}`,
      { every: minutes * 60 * 1000 },
      { data: { sourceId: source.id }, name: "fetch-source" },
    );
  }
}

export async function closeRssQueue(): Promise<void> {
  if (queue) await queue.close();
  if (connection) connection.disconnect();
  queue = null;
  connection = null;
}
