import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-neutral-500">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="h-3.5 w-3.5" aria-hidden /> : null}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="hover:text-brand-600 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-neutral-800">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
