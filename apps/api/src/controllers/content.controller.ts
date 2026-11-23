import type { Request, Response } from "express";
import { validatedQuery } from "../middleware/validate";
import type { AuthRequest } from "../middleware/auth";
import { AuthorsService } from "../services/authors.service";
import { BannersService } from "../services/banners.service";
import { AffiliatesService } from "../services/affiliates.service";
import { RedirectsService } from "../services/redirects.service";
import { logAudit } from "../services/audit.service";
import { asyncHandler, created, ok } from "../utils/response";
import { ApiError } from "../utils/errors";

export const BannersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await BannersService.list(validatedQuery<Record<string, unknown>>(req)));
  }),
  listActive: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await BannersService.listActive(req.params.placement as string));
  }),
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const banner = await BannersService.create(req.body);
    await logAudit(req.user?.id, "create", "banner", banner._id as string);
    created(res, banner);
  }),
  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const banner = await BannersService.update(req.params.id as string, req.body);
    await logAudit(req.user?.id, "update", "banner", req.params.id as string);
    ok(res, banner);
  }),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await BannersService.remove(req.params.id as string);
    await logAudit(req.user?.id, "delete", "banner", req.params.id as string);
    ok(res, { deleted: true });
  }),
  click: asyncHandler(async (req: Request, res: Response) => {
    await BannersService.recordClick(req.params.id as string);
    ok(res, { recorded: true });
  }),
};

export const AffiliatesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await AffiliatesService.list(validatedQuery<Record<string, unknown>>(req)));
  }),
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const link = await AffiliatesService.create(req.body);
    await logAudit(req.user?.id, "create", "affiliateLink", link._id as string);
    created(res, link);
  }),
  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const link = await AffiliatesService.update(req.params.id as string, req.body);
    await logAudit(req.user?.id, "update", "affiliateLink", req.params.id as string);
    ok(res, link);
  }),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await AffiliatesService.remove(req.params.id as string);
    await logAudit(req.user?.id, "delete", "affiliateLink", req.params.id as string);
    ok(res, { deleted: true });
  }),
  /** Public redirect: GET /go/:slug → 302 to the target URL. */
  go: asyncHandler(async (req: Request, res: Response) => {
    const target = await AffiliatesService.resolve(req.params.slug as string);
    res.redirect(302, target);
  }),

  /** JSON variant for the Next.js /go page: GET /affiliates/go/:slug. */
  goJson: asyncHandler(async (req: Request, res: Response) => {
    const target = await AffiliatesService.resolve(req.params.slug as string);
    ok(res, { targetUrl: target });
  }),
};

export const AuthorsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await AuthorsService.list(validatedQuery<Record<string, unknown>>(req)));
  }),
  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await AuthorsService.getBySlug(req.params.slug as string));
  }),
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const author = await AuthorsService.create(req.body);
    await logAudit(req.user?.id, "create", "author", author._id as string);
    created(res, author);
  }),
  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const author = await AuthorsService.update(req.params.id as string, req.body);
    await logAudit(req.user?.id, "update", "author", req.params.id as string);
    ok(res, author);
  }),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await AuthorsService.remove(req.params.id as string);
    await logAudit(req.user?.id, "delete", "author", req.params.id as string);
    ok(res, { deleted: true });
  }),
};

export const RedirectsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await RedirectsService.list(validatedQuery<Record<string, unknown>>(req)));
  }),
  resolve: asyncHandler(async (req: Request, res: Response) => {
    const from = typeof req.query.from === "string" ? req.query.from : "";
    if (!from) throw new ApiError(400, "VALIDATION_ERROR", "Query param 'from' is required.");
    const redirect = await RedirectsService.resolve(from);
    if (!redirect) throw new ApiError(404, "REDIRECT_NOT_FOUND", "No redirect for this path.");
    ok(res, redirect);
  }),
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const redirect = await RedirectsService.create(req.body);
    await logAudit(req.user?.id, "create", "redirect", redirect._id as string);
    created(res, redirect);
  }),
  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const redirect = await RedirectsService.update(req.params.id as string, req.body);
    await logAudit(req.user?.id, "update", "redirect", req.params.id as string);
    ok(res, redirect);
  }),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await RedirectsService.remove(req.params.id as string);
    await logAudit(req.user?.id, "delete", "redirect", req.params.id as string);
    ok(res, { deleted: true });
  }),
};
