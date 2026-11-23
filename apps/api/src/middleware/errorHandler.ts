import type { NextFunction, Request, Response } from "express";
import type { ApiResponse } from "@daily-pulse/shared";
import { ApiError } from "../utils/errors";

/** Central error handler — every error becomes the shared ApiResponse shape. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    const body: ApiResponse<null> = {
      data: null,
      error: { code: err.code, details: err.details, message: err.message },
      success: false,
    };
    res.status(err.statusCode).json(body);
    return;
  }
  // Sequelize unique-constraint / validation errors → 409 / 422, not 500.
  const name = (err as { name?: string } | null)?.name ?? "";
  const sequelizeError = err as { errors?: { message: string }[]; message?: string };
  if (name === "SequelizeUniqueConstraintError") {
    const body: ApiResponse<null> = {
      data: null,
      error: {
        code: "CONFLICT",
        details: (sequelizeError.errors ?? []).map((e) => e.message),
        message: "A record with that unique value already exists.",
      },
      success: false,
    };
    res.status(409).json(body);
    return;
  }
  if (name === "SequelizeValidationError" || name === "SequelizeForeignKeyConstraintError") {
    const body: ApiResponse<null> = {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        details: (sequelizeError.errors ?? []).map((e) => e.message),
        message: sequelizeError.message ?? "Validation failed.",
      },
      success: false,
    };
    res.status(422).json(body);
    return;
  }
  // eslint-disable-next-line no-console
  console.error("[api] unhandled error", err);
  const body: ApiResponse<null> = {
    data: null,
    error: { code: "INTERNAL_ERROR", message: "Internal server error." },
    success: false,
  };
  res.status(500).json(body);
}

/** 404 handler for unknown /api/v1 paths (registered after all routes). */
export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(404, "NOT_FOUND", "Route not found."));
}
