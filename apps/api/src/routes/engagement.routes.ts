import { Router } from "express";
import {
  CommentsController,
  MediaController,
  NewsletterController,
} from "../controllers/engagement.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  commentSchema,
  commentStatusSchema,
  newsletterSchema,
  paginationQuerySchema,
  unsubscribeSchema,
} from "../validators";

const router = Router();

// Newsletter — public subscribe/unsubscribe; list is staff-only.
router.get(
  "/newsletter",
  authenticate,
  requirePermission("newsletter.view"),
  validate({ query: paginationQuerySchema }),
  NewsletterController.list,
);
router.post(
  "/newsletter/subscribe",
  validate({ body: newsletterSchema }),
  NewsletterController.subscribe,
);
// Alias: the public site posts to POST /newsletter.
router.post("/newsletter", validate({ body: newsletterSchema }), NewsletterController.subscribe);
router.post(
  "/newsletter/unsubscribe",
  validate({ body: unsubscribeSchema }),
  NewsletterController.unsubscribe,
);
router.delete(
  "/newsletter/:id",
  authenticate,
  requirePermission("newsletter.view"),
  NewsletterController.remove,
);

// Comments — public read (approved) + create (pending); moderation is staff-only.
router.get(
  "/comments",
  authenticate,
  requirePermission("comments.moderate"),
  validate({ query: paginationQuerySchema }),
  CommentsController.listAll,
);
router.get(
  "/comments/post/:postId",
  validate({ query: paginationQuerySchema }),
  CommentsController.listForPost,
);
router.post("/comments", validate({ body: commentSchema }), CommentsController.create);
router.patch(
  "/comments/:id/status",
  authenticate,
  requirePermission("comments.moderate"),
  validate({ body: commentStatusSchema }),
  CommentsController.setStatus,
);
router.delete(
  "/comments/:id",
  authenticate,
  requirePermission("comments.moderate"),
  CommentsController.remove,
);

// Media — staff-only.
router.get(
  "/media",
  authenticate,
  requirePermission("media.manage"),
  validate({ query: paginationQuerySchema }),
  MediaController.list,
);
router.post(
  "/media/upload",
  authenticate,
  requirePermission("media.manage"),
  ...MediaController.uploadSingle,
);
router.delete(
  "/media/:id",
  authenticate,
  requirePermission("media.manage"),
  MediaController.remove,
);

export default router;
