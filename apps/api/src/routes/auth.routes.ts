import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { authRateLimit } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import { loginSchema } from "../validators";

const router = Router();

router.post("/login", authRateLimit, validate({ body: loginSchema }), AuthController.login);
router.post("/refresh", authRateLimit, AuthController.refresh);
router.post("/logout", AuthController.logout);
/** Registration is disabled — always 403 (see AuthService). */
router.post("/register", authRateLimit, AuthController.register);
router.get("/me", authenticate, AuthController.me);

export default router;
