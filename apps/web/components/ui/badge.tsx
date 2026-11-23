import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "default" | "green" | "amber" | "red" | "blue" | "neutral";

const TONES: Record<BadgeTone, string> = {
  default: "bg-brand-100 text-brand-700",
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  neutral: "bg-neutral-100 text-neutral-700",
};

export function Badge({ tone = "default", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Status badge for PostStatus / Comment status / Order status values. */
export function StatusBadge({ status }: { status: string }) {
  const tone: BadgeTone =
    status === "published" || status === "approved" || status === "paid"
      ? "green"
      : status === "draft" || status === "pending"
        ? "amber"
        : status === "scheduled" || status === "review"
          ? "blue"
          : status === "spam" ||
              status === "rejected" ||
              status === "failed" ||
              status === "refunded"
            ? "red"
            : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}
