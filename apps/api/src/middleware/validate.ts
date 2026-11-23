import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { ApiError } from "../utils/errors";

/**
 * Validate req.body / req.query / req.params against zod schemas.
 * On failure → 422 VALIDATION_ERROR with field-level details.
 */
export function validate<TBody = unknown, TQuery = unknown, TParams = unknown>(schemas: {
  body?: z.ZodType<TBody>;
  params?: z.ZodType<TParams>;
  query?: z.ZodType<TQuery>;
}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body ?? {});
      }
      if (schemas.query) {
        // Keep the parsed query on res.locals so handlers read typed values.
        (req as Request & { validatedQuery?: unknown }).validatedQuery = schemas.query.parse(
          req.query ?? {},
        );
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params ?? {}) as typeof req.params;
      }
      next();
    } catch (err) {
      const zodErr = err as { issues?: { message: string; path: (string | number)[] }[] };
      const details = (zodErr.issues ?? []).map((i) => ({
        message: i.message,
        path: i.path.join("."),
      }));
      next(new ApiError(422, "VALIDATION_ERROR", "Request validation failed.", details));
    }
  };
}

/** Read the zod-validated query object attached by `validate`. */
export function validatedQuery<T>(req: Request): T {
  return ((req as Request & { validatedQuery?: T }).validatedQuery ?? req.query) as T;
}
