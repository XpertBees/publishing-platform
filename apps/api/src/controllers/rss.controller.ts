import type { Request, Response } from "express";
import { validatedQuery } from "../middleware/validate";
import type { AuthRequest } from "../middleware/auth";
import { RssService } from "../services/rss.service";
import { enqueueRssFetch } from "../queues/rss.queue";
import { logAudit } from "../services/audit.service";
import { asyncHandler, created, ok } from "../utils/response";

export const RssController = {
  listSources: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await RssService.listSources(validatedQuery<Record<string, unknown>>(req)));
  }),
  getSource: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await RssService.getSource(req.params.id as string));
  }),
  createSource: asyncHandler(async (req: AuthRequest, res: Response) => {
    const source = await RssService.createSource(req.body);
    await logAudit(req.user?.id, "create", "rssSource", source._id as string);
    created(res, source);
  }),
  updateSource: asyncHandler(async (req: AuthRequest, res: Response) => {
    const source = await RssService.updateSource(req.params.id as string, req.body);
    await logAudit(req.user?.id, "update", "rssSource", req.params.id as string);
    ok(res, source);
  }),
  removeSource: asyncHandler(async (req: AuthRequest, res: Response) => {
    await RssService.removeSource(req.params.id as string);
    await logAudit(req.user?.id, "delete", "rssSource", req.params.id as string);
    ok(res, { deleted: true });
  }),
  /** Manual trigger — fetches the feed synchronously and returns the summary. */
  fetchNow: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await RssService.fetchNow(req.params.id as string);
    await logAudit(req.user?.id, "fetch", "rssSource", req.params.id as string, {
      created: result.created,
      postsCreated: result.postsCreated,
    });
    ok(res, result);
  }),
  /** Enqueue a background fetch instead of running it inline. */
  enqueueFetch: asyncHandler(async (req: AuthRequest, res: Response) => {
    await RssService.getSource(req.params.id as string);
    const job = await enqueueRssFetch(req.params.id as string);
    await logAudit(req.user?.id, "enqueue-fetch", "rssSource", req.params.id as string);
    ok(res, { jobId: job.id, queued: true });
  }),
  listItems: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await RssService.listItems(validatedQuery<Record<string, unknown>>(req)));
  }),
  importItem: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await RssService.importItem(req.params.id as string);
    await logAudit(req.user?.id, "import", "rssItem", req.params.id as string, {
      postId: result.postId as string,
    });
    ok(res, result);
  }),
};
