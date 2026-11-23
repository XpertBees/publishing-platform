import type { NextFunction, Request, Response } from "express";
import type { ApiResponse } from "@daily-pulse/shared";

/** Success envelope: { success: true, data }. */
export function ok<T>(res: Response, data: T, status = 200): void {
  const body: ApiResponse<T> = { data, success: true };
  res.status(status).json(body);
}

/** 201 Created envelope. */
export function created<T>(res: Response, data: T): void {
  ok(res, data, 201);
}

/** Wrap an async route handler so thrown errors reach the error handler. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
