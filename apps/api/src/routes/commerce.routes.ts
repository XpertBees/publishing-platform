import { Router } from "express";
import { OrdersController, ProductsController } from "../controllers/commerce.controller";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  orderSchema,
  orderStatusSchema,
  paginationQuerySchema,
  productSchema,
} from "../validators";

const router = Router();

// Products — public reads (active only), managed writes.
router.get("/products", validate({ query: paginationQuerySchema }), ProductsController.list);
router.get("/products/:slug", ProductsController.getBySlug);
router.post(
  "/products",
  authenticate,
  requirePermission("products.manage"),
  validate({ body: productSchema }),
  ProductsController.create,
);
router.patch(
  "/products/:id",
  authenticate,
  requirePermission("products.manage"),
  validate({ body: productSchema.partial() }),
  ProductsController.update,
);
router.delete(
  "/products/:id",
  authenticate,
  requirePermission("products.manage"),
  ProductsController.remove,
);

// Orders — public create (checkout); reads + status changes are staff-only.
router.get(
  "/orders",
  authenticate,
  requirePermission("orders.view"),
  validate({ query: paginationQuerySchema }),
  OrdersController.list,
);
router.get("/orders/:id", authenticate, requirePermission("orders.view"), OrdersController.getById);
router.post("/orders", validate({ body: orderSchema }), OrdersController.create);
router.patch(
  "/orders/:id/status",
  authenticate,
  requirePermission("products.manage"),
  validate({ body: orderStatusSchema }),
  OrdersController.updateStatus,
);

export default router;
