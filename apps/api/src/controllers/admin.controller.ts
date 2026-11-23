import type { Request, Response } from "express";
import { validatedQuery } from "../middleware/validate";
import type { AuthRequest } from "../middleware/auth";
import { UsersService } from "../services/users.service";
import { AdminService, AnalyticsService } from "../services/analytics.service";
import { SeoService, SettingsService } from "../services/settings.service";
import { logAudit } from "../services/audit.service";
import { asyncHandler, created, ok } from "../utils/response";

export const UsersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await UsersService.list(validatedQuery<Record<string, unknown>>(req)));
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await UsersService.getById(req.params.id as string));
  }),
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await UsersService.create(req.body);
    await logAudit(req.user?.id, "create", "user", user._id as string);
    created(res, user);
  }),
  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await UsersService.update(req.params.id as string, req.body);
    await logAudit(req.user?.id, "update", "user", req.params.id as string);
    ok(res, user);
  }),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await UsersService.remove(req.params.id as string);
    await logAudit(req.user?.id, "delete", "user", req.params.id as string);
    ok(res, { deleted: true });
  }),
};

export const SeoController = {
  get: asyncHandler(async (_req: Request, res: Response) => {
    ok(res, await SeoService.get());
  }),
  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const settings = await SeoService.update(req.body);
    await logAudit(req.user?.id, "update", "seoSettings", settings._id as string);
    ok(res, settings);
  }),
};

export const SettingsController = {
  get: asyncHandler(async (_req: Request, res: Response) => {
    ok(res, await SettingsService.get());
  }),
  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const settings = await SettingsService.update(req.body);
    await logAudit(req.user?.id, "update", "siteSettings", settings._id as string);
    ok(res, settings);
  }),
};

export const AnalyticsController = {
  recordEvent: asyncHandler(async (req: Request, res: Response) => {
    created(res, await AnalyticsService.recordEvent(req.body));
  }),
  listEvents: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await AnalyticsService.listEvents(validatedQuery<Record<string, unknown>>(req)));
  }),
  overview: asyncHandler(async (_req: Request, res: Response) => {
    ok(res, await AnalyticsService.overview());
  }),
};

export const AdminController = {
  overview: asyncHandler(async (_req: Request, res: Response) => {
    ok(res, await AdminService.overview());
  }),
  listAuditLogs: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await AdminService.listAuditLogs(validatedQuery<Record<string, unknown>>(req)));
  }),
};
