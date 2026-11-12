import Link from "next/link";
import { ProductImage } from "./ProductImage";
import { formatPrice } from "@/lib/format";
import type { ProductWithImages } from "@/types/database";

export function ProductCard({ product, priority = false }: { product: ProductWithImages; priority?: boolean }) {
  const image = product.product_images[0];
  const soldOut = product.stock <= 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative">
        <ProductImage src={image?.url ?? null} alt={image?.alt || product.name} priority={priority} className="rounded-sm" />
        {soldOut && (
          <span className="absolute top-3 left-3 rounded-full bg-cream/90 px-3 py-1 text-[11px] uppercase tracking-wider text-saddle">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          {product.categories && (
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{product.categories.name}</p>
          )}
          <h3 className="mt-1 font-serif text-xl text-espresso group-hover:text-cognac">{product.name}</h3>
        </div>
        <p className="mt-5 shrink-0 text-sm text-saddle">{formatPrice(product.price_cents)}</p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductWithImages[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-sand py-20 text-center">
        <p className="font-serif text-2xl text-saddle">No bags found</p>
        <p className="mt-2 text-sm text-muted">Try changing or clearing the filters.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 3} />
      ))}
    </div>
  );
}
