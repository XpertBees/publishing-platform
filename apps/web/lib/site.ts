export const SITE_NAME = "The Daily Pulse";
export const SITE_TAGLINE = "Lifestyle, Personal Finance, Technology & Breaking News";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_DESCRIPTION =
  "The Daily Pulse — original reporting and curated news across lifestyle, personal finance, technology and breaking news.";

export function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function canonicalFor(path: string, canonicalUrl?: string): string {
  if (canonicalUrl) return canonicalUrl;
  return `${SITE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Placeholder market data, clearly labelled until a market API is wired. */
export const PLACEHOLDER_TICKER = [
  { label: "SENSEX", value: "—", change: "—" },
  { label: "NIFTY 50", value: "—", change: "—" },
  { label: "USD / INR", value: "—", change: "—" },
  { label: "GOLD (10g)", value: "—", change: "—" },
  { label: "BRENT CRUDE", value: "—", change: "—" },
] as const;
