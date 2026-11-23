import { Router } from "express";
import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";
import commerceRoutes from "./commerce.routes";
import contentRoutes from "./content.routes";
import engagementRoutes from "./engagement.routes";
import postsRoutes from "./posts.routes";
import rssRoutes from "./rss.routes";
import taxonomyRoutes from "./taxonomy.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/posts", postsRoutes);
router.use(taxonomyRoutes);
router.use("/rss", rssRoutes);
router.use(contentRoutes);
router.use(commerceRoutes);
router.use(engagementRoutes);
router.use(adminRoutes);

router.get("/health", (_req, res) => {
  res.json({
    data: { status: "ok", uptimeSeconds: Math.round(process.uptime()) },
    success: true,
  });
});

export default router;
