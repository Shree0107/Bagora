import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ShopView } from "@/components/product/ShopView";
import { getCategoryBySlug, parseFilters } from "@/lib/data/catalog";
import { siteUrl } from "@/lib/env";

/** Old category URLs from before the relaunch. */
const RENAMED: Record<string, string> = { backpacks: "work-bags" };

export async function generateMetadata({ params }: PageProps<"/shop/[category]">): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).category);
  if (!category) return { title: "Not found" };
  return {
    title: `${category.name} · Genuine leather`,
    description: `${category.description} VÉRANE, prices in ₹ incl. GST.`,
    alternates: { canonical: `/shop/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/shop/[category]">) {
  const { category: slug } = await params;
  if (RENAMED[slug]) permanentRedirect(`/shop/${RENAMED[slug]}`);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shop", item: `${siteUrl()}/shop` },
      { "@type": "ListItem", position: 2, name: category.name, item: `${siteUrl()}/shop/${category.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }}
      />
      <ShopView category={category} filters={parseFilters(await searchParams)} />
    </>
  );
}
