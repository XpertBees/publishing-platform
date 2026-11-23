import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { clearRefreshCookie, parseCookies, setRefreshCookie } from "../utils/cookies";
import { ApiError } from "../utils/errors";
import { asyncHandler, ok } from "../utils/response";
import type { AuthRequest } from "../middleware/auth";

/** Refresh token: httpOnly cookie first, JSON body fallback. */
function refreshTokenFrom(req: Request): string | undefined {
  return (
    parseCookies(req).refreshToken ??
    (req.body as { refreshToken?: string } | undefined)?.refreshToken
  );
}

export const AuthController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string };
    const tokens = await AuthService.login(email, password);
    setRefreshCookie(res, tokens.refreshToken);
    ok(res, { accessToken: tokens.accessToken, user: tokens.user });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const token = refreshTokenFrom(req);
    if (!token) throw new ApiError(401, "INVALID_REFRESH_TOKEN", "No refresh token provided.");
    const tokens = await AuthService.refresh(token);
    setRefreshCookie(res, tokens.refreshToken);
    ok(res, { accessToken: tokens.accessToken, user: tokens.user });
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    clearRefreshCookie(res);
    ok(res, { loggedOut: true });
  }),

  register: asyncHandler(async (_req: Request, _res: Response) => {
    AuthService.registerDisabled();
  }),

  me: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Authentication required.");
    ok(res, await AuthService.me(req.user.id));
  }),
};
