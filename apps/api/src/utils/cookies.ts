import type { Request, Response } from "express";

export const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Minimal cookie parsing (no cookie-parser dependency). */
export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

/** Set the refresh token as an httpOnly cookie. */
export function setRefreshCookie(res: Response, token: string): void {
  const secure = process.env.NODE_ENV === "production";
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: REFRESH_MAX_AGE_MS,
    path: "/api/v1/auth",
    sameSite: "strict",
    secure,
  });
}

/** Clear the refresh-token cookie (logout). */
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/v1/auth" });
}
