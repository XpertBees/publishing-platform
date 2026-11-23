/** Central error type. Controllers/services throw ApiError; the error
 *  handler serialises it into the shared ApiResponse error shape. */
export class ApiError extends Error {
  readonly code: string;
  readonly details?: unknown;
  readonly statusCode: number;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "ApiError";
    this.statusCode = statusCode;
  }

  static badRequest(code: string, message: string, details?: unknown): ApiError {
    return new ApiError(400, code, message, details);
  }

  static conflict(code: string, message: string, details?: unknown): ApiError {
    return new ApiError(409, code, message, details);
  }

  static forbidden(code: string, message: string): ApiError {
    return new ApiError(403, code, message);
  }

  static notFound(code: string, message: string): ApiError {
    return new ApiError(404, code, message);
  }

  static unauthorized(code: string, message: string): ApiError {
    return new ApiError(401, code, message);
  }

  static unprocessable(code: string, message: string, details?: unknown): ApiError {
    return new ApiError(422, code, message, details);
  }
}
