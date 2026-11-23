import { Router } from "express";
import { CategoriesController, TagsController } from "../controllers/taxonomy.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { categorySchema, paginationQuerySchema, tagSchema } from "../validators";

const router = Router();

// Categories — public reads, managed writes.
router.get("/categories", validate({ query: paginationQuerySchema }), CategoriesController.list);
router.get("/categories/:slug", CategoriesController.getBySlug);
router.post(
  "/categories",
  authenticate,
  requirePermission("categories.manage"),
  validate({ body: categorySchema }),
  CategoriesController.create,
);
router.patch(
  "/categories/:id",
  authenticate,
  requirePermission("categories.manage"),
  validate({ body: categorySchema.partial() }),
  CategoriesController.update,
);
router.delete(
  "/categories/:id",
  authenticate,
  requirePermission("categories.manage"),
  CategoriesController.remove,
);

// Tags — public reads; create/delete need categories.manage (no tag permission exists).
router.get("/tags", validate({ query: paginationQuerySchema }), TagsController.list);
router.post(
  "/tags",
  authenticate,
  requirePermission("categories.manage"),
  validate({ body: tagSchema }),
  TagsController.create,
);
router.delete(
  "/tags/:id",
  authenticate,
  requirePermission("categories.manage"),
  TagsController.remove,
);

export default router;
