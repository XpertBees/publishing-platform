import { Router } from "express";
import { PostsController } from "../controllers/posts.controller";
import { authenticate, optionalAuth, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  postCreateSchema,
  postListQuerySchema,
  postUpdateSchema,
  publishSchema,
} from "../validators";

const router = Router();

router.get("/", optionalAuth, validate({ query: postListQuerySchema }), PostsController.list);
router.get(
  "/search",
  optionalAuth,
  validate({ query: postListQuerySchema }),
  PostsController.search,
);
router.get("/:slug", optionalAuth, PostsController.getBySlug);
router.post(
  "/",
  authenticate,
  requirePermission("posts.create"),
  validate({ body: postCreateSchema }),
  PostsController.create,
);
router.get("/id/:id", authenticate, requirePermission("posts.view"), PostsController.getById);
router.patch(
  "/:id",
  authenticate,
  requirePermission("posts.edit"),
  validate({ body: postUpdateSchema }),
  PostsController.update,
);
router.post(
  "/:id/publish",
  authenticate,
  requirePermission("posts.publish"),
  validate({ body: publishSchema }),
  PostsController.publish,
);
router.post(
  "/:id/schedule",
  authenticate,
  requirePermission("posts.publish"),
  validate({ body: publishSchema }),
  PostsController.schedule,
);
router.delete("/:id", authenticate, requirePermission("posts.delete"), PostsController.remove);

export default router;
