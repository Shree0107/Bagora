import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { container } from "@/components/ui/styles";
import { ProductView } from "@/components/product/ProductView";
import { ProductDetails, TrustRow } from "@/components/product/Details";
import { Reviews } from "@/components/product/Reviews";
import { ProductCard } from "@/components/product/ProductCard";
import { getCompleteTheLook, getProductBySlug, getReviews, pickVariant, slugColour } from "@/lib/data/catalog";
import { priceFor } from "@/lib/markets";
import { publicSettings, siteUrl } from "@/lib/env";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Bag not found" };
  const image = product.product_images[0]?.url;
  return {
    title: product.name,
    description: product.description.slice(0, 155),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, description: product.description.slice(0, 155), images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params, searchParams }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const colourParam = (await searchParams).colour;
  const variant = pickVariant(product, typeof colourParam === "string" ? colourParam : null);
  const price = priceFor(product);
  const user = await getCurrentUser();

  const [{ reviews, average }, look, profile, canReview] = await Promise.all([
    getReviews(product.id),
    getCompleteTheLook(product),
    getCurrentProfile(),
    user
      ? createClient().then((s) => s.rpc("has_purchased", { p_product_id: product.id }).then((r) => r.data === true))
      : Promise.resolve(false),
  ]);

  const url = `${siteUrl()}/products/${product.slug}`;
  const abs = (u: string) => (u.startsWith("http") ? u : `${siteUrl()}${u}`);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      sku: product.style_ref ? `VR-${product.style_ref}` : product.id,
      brand: { "@type": "Brand", name: "VÉRANE" },
      category: product.categories?.name,
      material: product.leather ?? undefined,
      image: product.product_images.map((i) => abs(i.url)),
      url,
      ...(price !== null && {
        offers: product.product_variants.map((v) => ({
          "@type": "Offer",
          name: `${product.name}, ${v.colour_name}`,
          url: `${url}?colour=${slugColour(v.colour_name)}`,
          priceCurrency: "INR",
          price: (price / 100).toFixed(2),
          availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          color: v.colour_name,
        })),
      }),
      ...(average !== null && {
        aggregateRating: { "@type": "AggregateRating", ratingValue: average.toFixed(1), reviewCount: reviews.length },
      }),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Shop", item: `${siteUrl()}/shop` },
        ...(product.categories
          ? [{ "@type": "ListItem", position: 2, name: product.categories.name, item: `${siteUrl()}/shop/${product.categories.slug}` }]
          : []),
        { "@type": "ListItem", position: product.categories ? 3 : 2, name: product.name, item: url },
      ],
    },
  ];

  return (
    <div className="bg-ivory">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="Breadcrumb" className={`${container} pt-6 pb-6 text-[13px] text-muted sm:pt-8`}>
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/shop" className="hover:text-espresso">Shop</Link></li>
          {product.categories && (
            <>
              <li aria-hidden>/</li>
              <li><Link href={`/shop/${product.categories.slug}`} className="hover:text-espresso">{product.categories.name}</Link></li>
            </>
          )}
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-espresso">{product.name}</li>
        </ol>
      </nav>

      <div className={`${container} pb-20`}>
        <ProductView
          productId={product.id}
          name={product.name}
          categoryName={product.categories?.name ?? null}
          price={price}
          images={product.product_images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, variant_id: i.variant_id }))}
          variants={product.product_variants.map((v) => ({
            id: v.id,
            colour_name: v.colour_name,
            colour_hex: v.colour_hex,
            stock: v.stock,
            slug: slugColour(v.colour_name),
          }))}
          initialVariantId={variant?.id ?? null}
          rating={average !== null ? { average, count: reviews.length } : null}
          whatsapp={publicSettings.whatsappNumber() || null}
        >
          <TrustRow />
          <div className="mt-2">
            <ProductDetails product={product} />
          </div>
        </ProductView>
      </div>

      <div className="border-t border-line bg-ivory">
        <div className={`${container} py-20 sm:py-24`}>
          <Reviews
            productId={product.id}
            slug={product.slug}
            name={product.name}
            reviews={reviews}
            average={average}
            canReview={canReview}
            isLoggedIn={Boolean(user)}
            defaultName={profile?.full_name?.split(" ")[0] ?? ""}
          />
        </div>
      </div>

      {look.length > 0 && (
        <section aria-labelledby="look-title" className="bg-ivory-deep">
          <div className={`${container} py-20 sm:py-24`}>
            <h2 id="look-title" className="font-display text-[clamp(2.2rem,4vw,3.25rem)] text-espresso">
              Complete the look
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-10">
              {look.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
