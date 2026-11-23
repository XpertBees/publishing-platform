import { PLACEHOLDER_TICKER } from "@/lib/site";

/**
 * Market ticker strip. Data is placeholder until a market-data API is
 * wired — the label says so, so placeholder values are never presented
 * as live quotes.
 */
export default function Ticker() {
  const items = [...PLACEHOLDER_TICKER, ...PLACEHOLDER_TICKER];
  return (
    <div className="overflow-hidden border-b border-neutral-200 bg-neutral-900 text-neutral-100">
      <div className="flex items-center">
        <span className="z-10 shrink-0 bg-brand-600 px-3 py-1.5 text-xs font-bold tracking-wide uppercase">
          Markets
        </span>
        <div className="animate-ticker flex w-max items-center gap-8 px-4 py-1.5 text-xs whitespace-nowrap">
          {items.map((item, i) => (
            <span key={`${item.label}-${i}`} className="flex items-center gap-2">
              <span className="font-semibold">{item.label}</span>
              <span>{item.value}</span>
              <span className="text-neutral-400">{item.change}</span>
            </span>
          ))}
        </div>
        <span className="ml-auto hidden shrink-0 px-3 text-[11px] text-neutral-400 sm:block">
          Placeholder data — live market feed coming soon
        </span>
      </div>
      <span className="sr-only">Market data shown is placeholder data.</span>
    </div>
  );
}
