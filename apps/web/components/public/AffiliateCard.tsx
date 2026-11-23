import Link from "next/link";
import { ExternalLink, Info } from "lucide-react";

/** Card for link_card / product-recommendation posts pointing off-site. */
export default function AffiliateCard({
  title,
  url,
  ctaLabel = "Read More",
  disclosure,
}: {
  title: string;
  url: string;
  ctaLabel?: string;
  disclosure?: boolean;
}) {
  return (
    <div className="mt-6 rounded-lg border border-brand-100 bg-brand-50 p-5">
      <p className="text-sm font-semibold text-brand-700">{title}</p>
      <Link
        href={url}
        target="_blank"
        rel="nofollow sponsored noopener"
        className="mt-3 inline-flex items-center gap-2 rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        {ctaLabel} <ExternalLink className="h-4 w-4" aria-hidden />
      </Link>
      {disclosure ? (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-neutral-600">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Affiliate disclosure: we may earn a commission if you buy through this link, at no extra
          cost to you.
        </p>
      ) : null}
    </div>
  );
}
