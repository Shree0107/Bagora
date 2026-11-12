import type { Metadata } from "next";
import { Suspense } from "react";
import { container, eyebrow } from "@/components/ui/styles";
import { ProductGrid } from "@/components/product/ProductCard";
import { ShopFilters } from "@/components/product/ShopFilters";
import { CategoryTabs } from "@/components/product/CategoryTabs";
import { getCategories, getProducts, parseFilters } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Shop all bags" };

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const filters = parseFilters(await searchParams);
  const [categories, products] = await Promise.all([getCategories(), getProducts(filters)]);

  return (
    <div className={`${container} py-12 sm:py-16`}>
      <p className={eyebrow}>The collection</p>
      <h1 className="mt-3 text-4xl text-espresso sm:text-5xl">All bags</h1>
      <p className="mt-3 text-sm text-muted">{products.length} styles</p>

      <div className="mt-8 space-y-6">
        <CategoryTabs categories={categories} />
        <Suspense>
          <ShopFilters />
        </Suspense>
      </div>

      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
