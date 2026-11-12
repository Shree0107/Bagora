import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { container, eyebrow } from "@/components/ui/styles";
import { ProductGrid } from "@/components/product/ProductCard";
import { ShopFilters } from "@/components/product/ShopFilters";
import { CategoryTabs } from "@/components/product/CategoryTabs";
import { getCategories, getCategoryBySlug, getProducts, parseFilters } from "@/lib/data/catalog";

export async function generateMetadata({ params }: PageProps<"/shop/[category]">): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).category);
  return { title: category?.name ?? "Category not found", description: category?.description };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/shop/[category]">) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const filters = parseFilters(await searchParams);
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ ...filters, categorySlug: slug }),
  ]);

  return (
    <div className={`${container} py-12 sm:py-16`}>
      <p className={eyebrow}>Category</p>
      <h1 className="mt-3 text-4xl text-espresso sm:text-5xl">{category.name}</h1>
      {category.description && <p className="mt-3 max-w-xl text-sm text-muted">{category.description}</p>}

      <div className="mt-8 space-y-6">
        <CategoryTabs categories={categories} active={slug} />
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
