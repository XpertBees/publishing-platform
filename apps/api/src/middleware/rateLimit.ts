import rateLimit from "express-rate-limit";

/**
 * General API limiter — generous, protects against accidental abuse.
 * Auth endpoints get a stricter limiter (brute-force protection).
 */
export const apiRateLimit = rateLimit({
  legacyHeaders: false,
  max: Number(process.env.RATE_LIMIT_MAX ?? 600),
  message: {
    data: null,
    error: { code: "RATE_LIMITED", message: "Too many requests." },
    success: false,
  },
  standardHeaders: "draft-7",
  windowMs: 15 * 60 * 1000,
});

export const authRateLimit = rateLimit({
  legacyHeaders: false,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 30),
  message: {
    data: null,
    error: { code: "RATE_LIMITED", message: "Too many login attempts. Try again later." },
    success: false,
  },
  standardHeaders: "draft-7",
  windowMs: 15 * 60 * 1000,
});
