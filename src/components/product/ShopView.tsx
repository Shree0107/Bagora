import Link from "next/link";
import { Suspense } from "react";
import { container, button } from "@/components/ui/styles";
import { ProductGrid } from "./ProductCard";
import { ShopFilters } from "./ShopFilters";
import { PRICE_BANDS, getAvailableColours, getCategories, getProducts, type ProductFilters } from "@/lib/data/catalog";
import type { Category } from "@/types/database";

/** Shared layout for /shop and /shop/[category]: title, filter rail, grid. */
export async function ShopView({
  category,
  filters,
}: Readonly<{ category: Category | null; filters: ProductFilters }>) {
  const [categories, colours, products] = await Promise.all([
    getCategories(),
    getAvailableColours(),
    getProducts({ ...filters, categorySlug: category?.slug }),
  ]);
  const filtered = Boolean(filters.colours?.length || filters.price || filters.inStockOnly);

  return (
    <div className="bg-ivory">
      <header className={`${container} pt-12 pb-8 sm:pt-16 lg:pt-20`}>
        <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-none text-espresso">
          {category?.name ?? "All bags"}
        </h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted">
          {category?.description ?? "Genuine leather totes, crossbody, shoulder and work bags. Every price includes GST."}
        </p>
      </header>

      <div className={`${container} pb-24`}>
        <Suspense>
          <ShopFilters
            shelves={categories.map((c) => ({ slug: c.slug, name: c.name }))}
            activeShelf={category?.slug}
            colours={colours}
            bands={PRICE_BANDS.map((b) => ({ id: b.id, label: b.label }))}
            count={products.length}
          >
            <ProductGrid
              products={products}
              empty={
                <div className="border border-line px-6 py-20 text-center">
                  <p className="font-display text-3xl text-espresso">
                    {filtered ? "Nothing in this shade yet" : "This shelf is being restocked"}
                  </p>
                  <p className="mx-auto mt-3 max-w-sm text-muted">
                    {filtered
                      ? "Try another colour or price, or see every bag in the collection."
                      : "New pieces arrive soon. In the meantime, the rest of the collection is waiting."}
                  </p>
                  <Link href="/shop" className={`${button.secondary} mt-8`}>
                    See all bags
                  </Link>
                </div>
              }
            />
          </ShopFilters>
        </Suspense>
      </div>
    </div>
  );
}
