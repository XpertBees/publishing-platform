import Link from "next/link";
import { VERTICALS } from "@daily-pulse/shared";

export default function CategoryNav({ activeSlug }: { activeSlug?: string }) {
  return (
    <nav aria-label="Sections" className="flex flex-wrap items-center gap-1">
      <Link
        href="/"
        className={`rounded px-3 py-2 text-sm font-semibold ${
          !activeSlug ? "bg-brand-600 text-white" : "text-neutral-700 hover:bg-neutral-100"
        }`}
      >
        Home
      </Link>
      {VERTICALS.map((v) => (
        <Link
          key={v.slug}
          href={`/category/${v.slug}`}
          className={`rounded px-3 py-2 text-sm font-semibold ${
            activeSlug === v.slug
              ? "bg-brand-600 text-white"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          {v.name}
        </Link>
      ))}
    </nav>
  );
}
