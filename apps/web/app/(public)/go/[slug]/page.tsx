import { redirect } from "next/navigation";
import { safeFetch } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Affiliate redirect: server-side. The API counts the click and returns
 * the target URL; we redirect to it. On any failure, fall back to home
 * instead of throwing or exposing an error page.
 */
export default async function GoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await safeFetch<{ targetUrl?: string } | null>(
    `/affiliates/go/${encodeURIComponent(slug)}`,
    null,
  );
  const target = result?.targetUrl;
  if (target && /^https?:\/\//.test(target)) {
    redirect(target);
  }
  redirect(SITE_URL);
}
