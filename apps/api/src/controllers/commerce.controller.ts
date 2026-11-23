import type { Request, Response } from "express";
import { validatedQuery } from "../middleware/validate";
import type { AuthRequest } from "../middleware/auth";
import { ProductsService } from "../services/products.service";
import { OrdersService } from "../services/orders.service";
import { logAudit } from "../services/audit.service";
import { asyncHandler, created, ok } from "../utils/response";

export const ProductsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await ProductsService.list(validatedQuery<Record<string, unknown>>(req)));
  }),
  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await ProductsService.getBySlug(req.params.slug as string));
  }),
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await ProductsService.create(req.body);
    await logAudit(req.user?.id, "create", "product", product._id as string);
    created(res, product);
  }),
  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await ProductsService.update(req.params.id as string, req.body);
    await logAudit(req.user?.id, "update", "product", req.params.id as string);
    ok(res, product);
  }),
  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await ProductsService.remove(req.params.id as string);
    await logAudit(req.user?.id, "delete", "product", req.params.id as string);
    ok(res, { deleted: true });
  }),
};

export const OrdersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await OrdersService.list(validatedQuery<Record<string, unknown>>(req)));
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    ok(res, await OrdersService.getById(req.params.id as string));
  }),
  /** Public checkout — creates a pending order with provider="manual". */
  create: asyncHandler(async (req: Request, res: Response) => {
    created(res, await OrdersService.create(req.body));
  }),
  updateStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await OrdersService.updateStatus(req.params.id as string, req.body.status);
    await logAudit(req.user?.id, "update-order-status", "order", req.params.id as string, {
      status: req.body.status,
    });
    ok(res, order);
  }),
};
