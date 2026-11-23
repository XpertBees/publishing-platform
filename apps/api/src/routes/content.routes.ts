import { Router } from "express";
import {
  AffiliatesController,
  AuthorsController,
  BannersController,
  RedirectsController,
} from "../controllers/content.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  affiliateLinkSchema,
  authorSchema,
  bannerSchema,
  paginationQuerySchema,
  redirectSchema,
} from "../validators";

const router = Router();

// Banners
router.get("/banners", validate({ query: paginationQuerySchema }), BannersController.list);
router.get("/banners/active/:placement", BannersController.listActive);
router.post(
  "/banners",
  authenticate,
  requirePermission("banners.manage"),
  validate({ body: bannerSchema }),
  BannersController.create,
);
router.patch(
  "/banners/:id",
  authenticate,
  requirePermission("banners.manage"),
  validate({ body: bannerSchema.partial() }),
  BannersController.update,
);
router.delete(
  "/banners/:id",
  authenticate,
  requirePermission("banners.manage"),
  BannersController.remove,
);
router.post("/banners/:id/click", BannersController.click);

// Affiliates (the /go/:slug redirect lives in server.ts, mounted at /go)
router.get(
  "/affiliates",
  authenticate,
  requirePermission("affiliates.manage"),
  validate({ query: paginationQuerySchema }),
  AffiliatesController.list,
);
router.post(
  "/affiliates",
  authenticate,
  requirePermission("affiliates.manage"),
  validate({ body: affiliateLinkSchema }),
  AffiliatesController.create,
);
router.patch(
  "/affiliates/:id",
  authenticate,
  requirePermission("affiliates.manage"),
  validate({ body: affiliateLinkSchema.partial() }),
  AffiliatesController.update,
);
router.delete(
  "/affiliates/:id",
  authenticate,
  requirePermission("affiliates.manage"),
  AffiliatesController.remove,
);
router.get("/affiliates/go/:slug", AffiliatesController.goJson);

// Authors
router.get("/authors", validate({ query: paginationQuerySchema }), AuthorsController.list);
router.get("/authors/:slug", AuthorsController.getBySlug);
router.post(
  "/authors",
  authenticate,
  requirePermission("authors.manage"),
  validate({ body: authorSchema }),
  AuthorsController.create,
);
router.patch(
  "/authors/:id",
  authenticate,
  requirePermission("authors.manage"),
  validate({ body: authorSchema.partial() }),
  AuthorsController.update,
);
router.delete(
  "/authors/:id",
  authenticate,
  requirePermission("authors.manage"),
  AuthorsController.remove,
);

// Redirects
router.get(
  "/redirects",
  authenticate,
  requirePermission("redirects.manage"),
  validate({ query: paginationQuerySchema }),
  RedirectsController.list,
);
router.get("/redirects/resolve", RedirectsController.resolve);
router.post(
  "/redirects",
  authenticate,
  requirePermission("redirects.manage"),
  validate({ body: redirectSchema }),
  RedirectsController.create,
);
router.patch(
  "/redirects/:id",
  authenticate,
  requirePermission("redirects.manage"),
  validate({ body: redirectSchema.partial() }),
  RedirectsController.update,
);
router.delete(
  "/redirects/:id",
  authenticate,
  requirePermission("redirects.manage"),
  RedirectsController.remove,
);

export default router;
