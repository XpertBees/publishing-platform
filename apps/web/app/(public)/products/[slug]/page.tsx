import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/public/Breadcrumbs";
import BuyProductForm from "@/components/public/BuyProductForm";
import { getProductBySlug } from "@/services/posts.service";
import { canonicalFor, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} — ${SITE_NAME}`,
    description: product.description ?? `${product.name} — a digital product from ${SITE_NAME}.`,
    alternates: { canonical: canonicalFor(`/products/${product.slug}`) },
    openGraph: {
      title: product.name,
      description: product.description,
      type: "website",
      url: canonicalFor(`/products/${product.slug}`),
      images: product.coverImage ? [{ url: product.coverImage }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.active) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: product.name }]} />
      {product.coverImage ? (
        <span className="relative block aspect-[16/9] overflow-hidden rounded-lg">
          <Image
            src={product.coverImage}
            alt={product.name}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </span>
      ) : null}
      <h1 className="mt-6 font-serif text-3xl font-bold text-neutral-900 md:text-4xl">
        {product.name}
      </h1>
      {product.description ? (
        <p className="mt-4 text-lg leading-relaxed text-neutral-700">{product.description}</p>
      ) : null}
      {product.sales > 0 ? (
        <p className="mt-3 text-sm text-neutral-500">
          {product.sales.toLocaleString("en-IN")} copies sold
        </p>
      ) : null}
      <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 p-6">
        <BuyProductForm
          productId={product._id}
          productName={product.name}
          price={product.price}
          currency={product.currency}
        />
      </div>
    </div>
  );
}
