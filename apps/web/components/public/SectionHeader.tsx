import Link from "next/link";

export default function SectionHeader({
  title,
  href,
  linkLabel = "View all",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between border-b-2 border-neutral-900 pb-2">
      <h2 className="font-serif text-2xl font-bold text-neutral-900">{title}</h2>
      {href ? (
        <Link href={href} className="text-sm font-semibold text-brand-600 hover:underline">
          {linkLabel} →
        </Link>
      ) : null}
    </div>
  );
}
