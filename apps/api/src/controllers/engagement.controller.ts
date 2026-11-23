import type { Request, Response } from "express";
import { validatedQuery } from "../middleware/validate";
import type { AuthRequest } from "../middleware/auth";
import { NewsletterService } from "../services/newsletter.service";
import { CommentsService } from "../services/comments.service";
import { MediaService, upload } from "../services/media.service";
import { logAudit } from "../services/audit.service";
import { ApiError } from "../utils/errors";
import { asyncHandler, created, ok } from "../utils/response";

export const NewsletterController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await NewsletterService.list(validatedQuery<Record<string, unknown>>(req)));
  }),
  subscribe: asyncHandler(async (req: Request, res: Response) => {
    created(res, await NewsletterService.subscribe(req.body));
  }),
  unsubscribe: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await NewsletterService.unsubscribe(req.body.email as string));
  }),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await NewsletterService.remove(req.params.id as string);
    await logAudit(req.user?.id, "delete", "newsletterSubscriber", req.params.id as string);
    ok(res, { deleted: true });
  }),
};

export const CommentsController = {
  listForPost: asyncHandler(async (req: Request, res: Response) => {
    ok(
      res,
      await CommentsService.listForPost(
        req.params.postId as string,
        validatedQuery<Record<string, unknown>>(req),
      ),
    );
  }),
  listAll: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await CommentsService.listAll(validatedQuery<Record<string, unknown>>(req)));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    created(res, await CommentsService.create(req.body));
  }),
  setStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const comment = await CommentsService.setStatus(req.params.id as string, req.body.status);
    await logAudit(req.user?.id, "moderate-comment", "comment", req.params.id as string, {
      status: req.body.status,
    });
    ok(res, comment);
  }),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await CommentsService.remove(req.params.id as string);
    await logAudit(req.user?.id, "delete", "comment", req.params.id as string);
    ok(res, { deleted: true });
  }),
};

export const MediaController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await MediaService.list(validatedQuery<Record<string, unknown>>(req)));
  }),
  uploadSingle: [
    upload.single("file"),
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file) throw new ApiError(400, "NO_FILE", "No file was uploaded (field name: 'file').");
      const alt = typeof req.body?.alt === "string" ? req.body.alt : undefined;
      const media = await MediaService.createFromUpload(file, req.user?.id, alt);
      await logAudit(req.user?.id, "upload", "media", media._id as string);
      created(res, media);
    }),
  ],
  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await MediaService.remove(req.params.id as string);
    await logAudit(req.user?.id, "delete", "media", req.params.id as string);
    ok(res, { deleted: true });
  }),
};
