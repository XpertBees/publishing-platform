import type { Request, Response } from "express";
import { validatedQuery } from "../middleware/validate";
import type { AuthRequest } from "../middleware/auth";
import { CategoriesService } from "../services/categories.service";
import { TagsService } from "../services/tags.service";
import { logAudit } from "../services/audit.service";
import { asyncHandler, created, ok } from "../utils/response";

export const CategoriesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await CategoriesService.list(validatedQuery<Record<string, unknown>>(req)));
  }),
  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await CategoriesService.getBySlug(req.params.slug as string));
  }),
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const category = await CategoriesService.create(req.body);
    await logAudit(req.user?.id, "create", "category", category._id as string);
    created(res, category);
  }),
  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const category = await CategoriesService.update(req.params.id as string, req.body);
    await logAudit(req.user?.id, "update", "category", req.params.id as string);
    ok(res, category);
  }),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await CategoriesService.remove(req.params.id as string);
    await logAudit(req.user?.id, "delete", "category", req.params.id as string);
    ok(res, { deleted: true });
  }),
};

export const TagsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await TagsService.list(validatedQuery<Record<string, unknown>>(req)));
  }),
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const tag = await TagsService.create(req.body);
    await logAudit(req.user?.id, "create", "tag", tag._id as string);
    created(res, tag);
  }),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await TagsService.remove(req.params.id as string);
    await logAudit(req.user?.id, "delete", "tag", req.params.id as string);
    ok(res, { deleted: true });
  }),
};
