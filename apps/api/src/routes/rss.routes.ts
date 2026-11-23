import { Router } from "express";
import { RssController } from "../controllers/rss.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { paginationQuerySchema, rssSourceSchema } from "../validators";

const router = Router();

router.get(
  "/sources",
  authenticate,
  requirePermission("rss.manage"),
  validate({ query: paginationQuerySchema }),
  RssController.listSources,
);
router.post(
  "/sources",
  authenticate,
  requirePermission("rss.manage"),
  validate({ body: rssSourceSchema }),
  RssController.createSource,
);
router.get("/sources/:id", authenticate, requirePermission("rss.manage"), RssController.getSource);
router.patch(
  "/sources/:id",
  authenticate,
  requirePermission("rss.manage"),
  validate({ body: rssSourceSchema.partial() }),
  RssController.updateSource,
);
router.delete(
  "/sources/:id",
  authenticate,
  requirePermission("rss.manage"),
  RssController.removeSource,
);
router.post(
  "/sources/:id/fetch",
  authenticate,
  requirePermission("rss.manage"),
  RssController.fetchNow,
);
router.post(
  "/sources/:id/enqueue",
  authenticate,
  requirePermission("rss.manage"),
  RssController.enqueueFetch,
);
router.get(
  "/items",
  authenticate,
  requirePermission("rss.manage"),
  validate({ query: paginationQuerySchema }),
  RssController.listItems,
);
router.post(
  "/items/:id/import",
  authenticate,
  requirePermission("rss.manage"),
  RssController.importItem,
);

export default router;
