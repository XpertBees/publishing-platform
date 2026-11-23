import { Router } from "express";
import {
  AdminController,
  AnalyticsController,
  SeoController,
  SettingsController,
  UsersController,
} from "../controllers/admin.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  analyticsEventSchema,
  paginationQuerySchema,
  seoSettingsSchema,
  siteSettingsSchema,
  userCreateSchema,
} from "../validators";

const router = Router();

// Users — super_admin only (users.manage).
router.get(
  "/users",
  authenticate,
  requirePermission("users.manage"),
  validate({ query: paginationQuerySchema }),
  UsersController.list,
);
router.post(
  "/users",
  authenticate,
  requirePermission("users.manage"),
  validate({ body: userCreateSchema }),
  UsersController.create,
);
router.get("/users/:id", authenticate, requirePermission("users.manage"), UsersController.getById);
router.patch(
  "/users/:id",
  authenticate,
  requirePermission("users.manage"),
  validate({ body: userCreateSchema.partial() }),
  UsersController.update,
);
router.delete(
  "/users/:id",
  authenticate,
  requirePermission("users.manage"),
  UsersController.remove,
);

// SEO settings — public read, seo.manage writes.
router.get("/seo-settings", SeoController.get);
router.put(
  "/seo-settings",
  authenticate,
  requirePermission("seo.manage"),
  validate({ body: seoSettingsSchema }),
  SeoController.update,
);
// PATCH alias (partial updates) — the admin dashboard uses PATCH.
router.patch(
  "/seo-settings",
  authenticate,
  requirePermission("seo.manage"),
  validate({ body: seoSettingsSchema.partial() }),
  SeoController.update,
);

// Site settings — public read, settings.manage writes.
router.get("/site-settings", SettingsController.get);
router.put(
  "/site-settings",
  authenticate,
  requirePermission("settings.manage"),
  validate({ body: siteSettingsSchema }),
  SettingsController.update,
);
// PATCH alias (partial updates) — the admin dashboard uses PATCH.
router.patch(
  "/site-settings",
  authenticate,
  requirePermission("settings.manage"),
  validate({ body: siteSettingsSchema.partial() }),
  SettingsController.update,
);

// Analytics — public event recording; reads need analytics.view.
router.post(
  "/analytics/events",
  validate({ body: analyticsEventSchema }),
  AnalyticsController.recordEvent,
);
router.get(
  "/analytics/events",
  authenticate,
  requirePermission("analytics.view"),
  validate({ query: paginationQuerySchema }),
  AnalyticsController.listEvents,
);
router.get(
  "/analytics/overview",
  authenticate,
  requirePermission("analytics.view"),
  AnalyticsController.overview,
);

// Admin dashboard + audit log.
router.get(
  "/admin/overview",
  authenticate,
  requirePermission("analytics.view"),
  AdminController.overview,
);
router.get(
  "/admin/audit-logs",
  authenticate,
  requirePermission("analytics.view"),
  validate({ query: paginationQuerySchema }),
  AdminController.listAuditLogs,
);

export default router;
