import type { Metadata } from "next";
import Breadcrumbs from "@/components/public/Breadcrumbs";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `About — ${SITE_NAME}`,
  description: `About ${SITE_NAME} — original reporting and curated news across lifestyle, personal finance, technology and breaking news.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <h1 className="font-serif text-3xl font-bold text-neutral-900">About {SITE_NAME}</h1>
      <div className="mt-4 space-y-4 text-lg leading-relaxed text-neutral-700">
        <p>
          {SITE_NAME} is an independent multi-niche publication covering lifestyle, personal
          finance, technology and breaking news. We publish original reporting, practical guides and
          curated news — written to be useful, not just to be read.
        </p>
        <p>
          Our newsroom is small and our standards are plain: verify before publishing, correct
          mistakes openly, and label sponsored content and affiliate links clearly so readers always
          know what they are looking at.
        </p>
        <p>
          Some links on this site are affiliate links. If you buy through them, we may earn a
          commission at no extra cost to you — it helps keep the publication free.
        </p>
      </div>
    </div>
  );
}
