import { Queue, Worker } from "bullmq";
import { Op } from "sequelize";
import { getRedisConnection } from "../queues/rss.queue";
import { AnalyticsEvent } from "../models/AnalyticsEvent";
import { AuditLog } from "../models/AuditLog";

/**
 * Cleanup job — MySQL 8.4 has no TTL indexes, so old analyticsEvents and
 * auditLogs are pruned by this repeatable BullMQ job (daily, 90-day retention).
 */
export const CLEANUP_QUEUE_NAME = "cleanup";
export const RETENTION_DAYS = 90;

export async function runCleanup(): Promise<{ analyticsDeleted: number; auditDeleted: number }> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const analyticsDeleted = await AnalyticsEvent.destroy({
    where: { createdAt: { [Op.lt]: cutoff } },
  });
  const auditDeleted = await AuditLog.destroy({ where: { createdAt: { [Op.lt]: cutoff } } });
  // eslint-disable-next-line no-console
  console.log(
    `[cleanup] pruned ${analyticsDeleted} analytics events, ${auditDeleted} audit logs older than ${RETENTION_DAYS}d.`,
  );
  return { analyticsDeleted, auditDeleted };
}

let worker: Worker | null = null;

export async function startCleanupWorker(): Promise<void> {
  if (worker) return;
  const queue = new Queue(CLEANUP_QUEUE_NAME, { connection: getRedisConnection() });
  await queue.upsertJobScheduler(
    "daily-cleanup",
    { pattern: "0 3 * * *" },
    { data: {}, name: "cleanup" },
  );
  worker = new Worker(CLEANUP_QUEUE_NAME, async () => runCleanup(), {
    connection: getRedisConnection(),
  });
  worker.on("failed", (_job, err) => {
    // eslint-disable-next-line no-console
    console.error("[cleanup] job failed:", err.message);
  });
  // eslint-disable-next-line no-console
  console.log("[cleanup] worker started (daily 03:00).");
}

export async function closeCleanupWorker(): Promise<void> {
  if (worker) await worker.close();
  worker = null;
}
