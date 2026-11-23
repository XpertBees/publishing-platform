import type { Metadata } from "next";
import Breadcrumbs from "@/components/public/Breadcrumbs";
import NewsletterForm from "@/components/public/NewsletterForm";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Newsletter — ${SITE_NAME}`,
  description: `Subscribe to ${SITE_NAME} — the day's top stories across lifestyle, money, tech and breaking news, every morning.`,
};

export default function NewsletterPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Newsletter" }]} />
      <h1 className="font-serif text-3xl font-bold text-neutral-900">The Daily Pulse Newsletter</h1>
      <p className="mt-3 text-lg leading-relaxed text-neutral-600">
        One email a day with the top stories across lifestyle, personal finance, technology and
        breaking news — plus the occasional guide or product we genuinely recommend. No spam,
        unsubscribe anytime.
      </p>
      <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-6">
        <NewsletterForm source="newsletter-page" />
      </div>
    </div>
  );
}
