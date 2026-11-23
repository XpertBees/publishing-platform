import morgan from "morgan";

/**
 * HTTP request logging. `combined` in production, `dev` elsewhere.
 * Morgan writes to stdout; the platform log pipeline collects it.
 */
export function requestLogger(): ReturnType<typeof morgan> {
  const format = process.env.NODE_ENV === "production" ? "combined" : "dev";
  return morgan(format, {
    skip: (req) => {
      const url = (req as unknown as { url?: string }).url ?? "";
      return url === "/api/v1/health" || url.startsWith("/api/v1/health?");
    },
  });
}
