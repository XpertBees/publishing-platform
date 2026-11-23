import { Worker, type Job } from "bullmq";
import { getRedisConnection, RSS_QUEUE_NAME, scheduleRssJobs } from "../queues/rss.queue";
import { fetchSource } from "../services/rss.service";
import { RssSource } from "../models/RssSource";

export interface RssFetchJobData {
  sourceId: string;
}

export interface RssFetchJobResult {
  created: number;
  postsCreated: number;
  skipped: number;
  sourceId: string;
}

/** Process one fetch job: ingest the source's feed (dedup by guid). */
export async function processRssFetch(job: Job<RssFetchJobData>): Promise<RssFetchJobResult> {
  const source = await RssSource.findByPk(job.data.sourceId);
  if (!source) throw new Error(`RSS source ${job.data.sourceId} not found.`);
  if (!source.active) return { created: 0, postsCreated: 0, skipped: 0, sourceId: source.id };
  return fetchSource(source);
}

let worker: Worker<RssFetchJobData, RssFetchJobResult> | null = null;

/** Start the rss-ingest worker and (re)register repeatable jobs. */
export async function startRssWorker(): Promise<void> {
  if (worker) return;
  worker = new Worker<RssFetchJobData, RssFetchJobResult>(
    RSS_QUEUE_NAME,
    async (job) => processRssFetch(job),
    { connection: getRedisConnection() },
  );
  worker.on("failed", (job, err) => {
    // eslint-disable-next-line no-console
    console.error(`[rss] job ${job?.id} failed:`, err.message);
  });
  const sources = await RssSource.findAll({ where: { active: true } });
  await scheduleRssJobs(
    sources.map((s) => ({ fetchIntervalMinutes: s.fetchIntervalMinutes, id: s.id })),
  );
  // eslint-disable-next-line no-console
  console.log(`[rss] worker started, ${sources.length} active source(s) scheduled.`);
}

export async function closeRssWorker(): Promise<void> {
  if (worker) await worker.close();
  worker = null;
}
