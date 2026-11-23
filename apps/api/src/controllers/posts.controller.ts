import type { Request, Response } from "express";
import { roleHasPermission, type AuthRequest } from "../middleware/auth";
import { validatedQuery } from "../middleware/validate";
import { PostsService } from "../services/posts.service";
import { logAudit } from "../services/audit.service";
import { asyncHandler, created, ok } from "../utils/response";

function canSeeUnpublished(req: AuthRequest): boolean {
  return !!req.user && roleHasPermission(req.user.role, "posts.view");
}

export const PostsController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = validatedQuery<Record<string, unknown>>(req as Request);
    ok(res, await PostsService.list(query, canSeeUnpublished(req)));
  }),

  /** Public search — dedicated endpoint (registered before `/:slug`). */
  search: asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = validatedQuery<Record<string, unknown>>(req as Request);
    ok(res, await PostsService.list(query, false));
  }),

  getBySlug: asyncHandler(async (req: AuthRequest, res: Response) => {
    const post = await PostsService.getBySlug(req.params.slug as string, canSeeUnpublished(req));
    // Fire-and-forget view counter + page-view event (never block the read).
    const id = post._id as string;
    PostsService.incrementViews(id).catch(() => undefined);
    ok(res, post);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await PostsService.getById(req.params.id as string));
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const post = await PostsService.create(req.body);
    await logAudit(req.user?.id, "create", "post", post._id as string, { slug: post.slug });
    created(res, post);
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const post = await PostsService.update(req.params.id as string, req.body);
    await logAudit(req.user?.id, "update", "post", req.params.id as string);
    ok(res, post);
  }),

  publish: asyncHandler(async (req: AuthRequest, res: Response) => {
    const post = await PostsService.publish(
      req.params.id as string,
      req.body?.publishedAt as string | undefined,
    );
    await logAudit(req.user?.id, "publish", "post", req.params.id as string);
    ok(res, post);
  }),

  schedule: asyncHandler(async (req: AuthRequest, res: Response) => {
    const post = await PostsService.schedule(
      req.params.id as string,
      req.body.publishedAt as string,
    );
    await logAudit(req.user?.id, "schedule", "post", req.params.id as string, {
      publishedAt: req.body.publishedAt,
    });
    ok(res, post);
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await PostsService.remove(req.params.id as string);
    await logAudit(req.user?.id, "delete", "post", req.params.id as string);
    ok(res, { deleted: true });
  }),
};
