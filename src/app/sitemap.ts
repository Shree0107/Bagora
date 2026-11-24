import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { getAllProductSlugs, getCategories } from "@/lib/data/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [categories, products] = await Promise.all([
    getCategories().catch(() => []),
    getAllProductSlugs().catch(() => []),
  ]);
  const pages = ["", "/shop", "/our-story", "/contact", "/shipping-returns", "/track-order", "/privacy", "/terms"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...categories.map((c) => ({ url: `${base}/shop/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
