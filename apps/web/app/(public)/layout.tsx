import Link from "next/link";
import { VERTICALS } from "@daily-pulse/shared";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import CategoryNav from "@/components/public/CategoryNav";
import NewsletterForm from "@/components/public/NewsletterForm";
import SearchBox from "@/components/public/SearchBox";
import Ticker from "@/components/public/Ticker";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top utility bar */}
      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-xs text-neutral-600">
          <span>{today}</span>
          <span className="hidden sm:block">India Edition</span>
          <Link
            href="/newsletter"
            className="hidden font-semibold text-brand-600 hover:underline sm:block"
          >
            Newsletter
          </Link>
        </div>
      </div>

      {/* Masthead */}
      <header className="border-b-2 border-neutral-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-5 md:flex-row md:justify-between">
          <Link href="/" className="text-center md:text-left">
            <span className="font-serif text-4xl font-black tracking-tight text-neutral-900 md:text-5xl">
              The Daily <span className="text-brand-600">Pulse</span>
            </span>
            <span className="mt-1 block text-sm text-neutral-500">{SITE_TAGLINE}</span>
          </Link>
          <SearchBox />
        </div>
        <div className="border-t border-neutral-200">
          <div className="mx-auto max-w-7xl px-4 py-1">
            <CategoryNav />
          </div>
        </div>
      </header>

      <Ticker />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="border-t-2 border-neutral-900 bg-neutral-900 text-neutral-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
          <div>
            <p className="font-serif text-2xl font-black text-white">
              The Daily <span className="text-brand-500">Pulse</span>
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              Original reporting and curated news across lifestyle, personal finance, technology and
              breaking news.
            </p>
          </div>
          <nav aria-label="Footer sections">
            <p className="mb-3 text-sm font-bold tracking-wide text-white uppercase">Sections</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              {VERTICALS.map((v) => (
                <li key={v.slug}>
                  <Link href={`/category/${v.slug}`} className="hover:text-white">
                    {v.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="mb-3 text-sm font-bold tracking-wide text-white uppercase">Newsletter</p>
            <p className="mb-3 text-sm text-neutral-400">
              The day&apos;s top stories, in your inbox every morning.
            </p>
            <NewsletterForm source="footer" />
            <p className="mt-4 text-sm">
              <Link href="/about" className="hover:text-white">
                About us
              </Link>
              {" · "}
              <Link href="/search" className="hover:text-white">
                Search
              </Link>
            </p>
          </div>
        </div>
        <div className="border-t border-neutral-800">
          <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-neutral-500">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved. Market data shown is
            placeholder data until a live feed is connected.
          </p>
        </div>
      </footer>
    </div>
  );
}
