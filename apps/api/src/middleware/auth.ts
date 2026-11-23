import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Permission, Role } from "@daily-pulse/shared";
import { ROLE_PERMISSIONS } from "@daily-pulse/shared";
import { ApiError } from "../utils/errors";

export interface AuthUser {
  email: string;
  id: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface AccessTokenPayload {
  email: string;
  role: Role;
  sub: string;
}

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new ApiError(500, "CONFIG_ERROR", "JWT_SECRET is not configured.");
  return secret;
}

/** Sign a short-lived access token (default 15m via JWT_EXPIRES_IN). */
export function signAccessToken(user: AuthUser): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "15m") as jwt.SignOptions["expiresIn"];
  return jwt.sign({ email: user.email, role: user.role, sub: user.id }, jwtSecret(), { expiresIn });
}

/** Sign a long-lived refresh token (default 7d via JWT_REFRESH_EXPIRES_IN). */
export function signRefreshToken(user: AuthUser): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new ApiError(500, "CONFIG_ERROR", "JWT_REFRESH_SECRET is not configured.");
  const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"];
  return jwt.sign({ email: user.email, role: user.role, sub: user.id }, secret, { expiresIn });
}

/** Verify a refresh token and return its payload. */
export function verifyRefreshToken(token: string): AccessTokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new ApiError(500, "CONFIG_ERROR", "JWT_REFRESH_SECRET is not configured.");
  try {
    return jwt.verify(token, secret) as AccessTokenPayload;
  } catch {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
  }
}

/**
 * Authenticate via `Authorization: Bearer <accessToken>`.
 * Sets req.user; rejects missing/invalid/expired tokens with 401.
 */
export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next(new ApiError(401, "UNAUTHORIZED", "Missing or malformed Authorization header."));
    return;
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = jwt.verify(token, jwtSecret()) as AccessTokenPayload;
    req.user = { email: payload.email, id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, "UNAUTHORIZED", "Access token is invalid or expired."));
  }
}

/**
 * Optional auth — attaches req.user when a valid Bearer token is present,
 * but never rejects anonymous requests. Used by public list endpoints that
 * widen filters for staff (e.g. GET /posts?status=draft).
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(
        header.slice("Bearer ".length).trim(),
        jwtSecret(),
      ) as AccessTokenPayload;
      req.user = { email: payload.email, id: payload.sub, role: payload.role };
    } catch {
      // Ignore invalid tokens on optional auth — request stays anonymous.
    }
  }
  next();
}

/** Does this role hold this permission? Pure — unit tested. */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

/**
 * RBAC guard — must run after `authenticate`. Rejects with 403 unless the
 * caller's role grants the permission (server-side, per the shared contract).
 */
export function requirePermission(permission: Permission) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, "UNAUTHORIZED", "Authentication required."));
      return;
    }
    if (!roleHasPermission(req.user.role, permission)) {
      next(
        new ApiError(
          403,
          "FORBIDDEN",
          `Role "${req.user.role}" does not have permission "${permission}".`,
        ),
      );
      return;
    }
    next();
  };
}
