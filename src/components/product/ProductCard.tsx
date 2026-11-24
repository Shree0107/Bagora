import Image from "next/image";
import Link from "next/link";
import { ProductImage } from "./ProductImage";
import { formatMoney, priceFor } from "@/lib/markets";
import { slugColour } from "@/lib/data/catalog";
import type { ProductWithImages } from "@/types/database";

/**
 * A bag on the shelf: 4:5 photo on its plinth (second photo fades in on hover),
 * the name in display type, price, and the colours it comes in.
 */
export function ProductCard({
  product,
  priority = false,
  sizes,
}: Readonly<{ product: ProductWithImages; priority?: boolean; sizes?: string }>) {
  const [first, second] = product.product_images;
  const variants = product.product_variants;
  const soldOut = product.stock <= 0;
  const price = priceFor(product);
  const href = `/products/${product.slug}`;

  return (
    <article className="group relative">
      <Link href={href} className="block focus-visible:outline-offset-4">
        <div className="relative">
          <ProductImage src={first?.url ?? null} alt={first?.alt || product.name} priority={priority} sizes={sizes} />
          {second && (
            <Image
              src={second.url}
              alt=""
              fill
              sizes={sizes ?? "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 50vw"}
              className="hidden object-cover opacity-0 transition-opacity duration-700 ease-out sm:block sm:group-hover:opacity-100"
            />
          )}
          {soldOut && (
            <span className="plate-label absolute top-3 left-3 bg-ivory/90 px-3 py-1.5 text-espresso">Back soon</span>
          )}
        </div>
        <h3 className="mt-4 font-display text-[21px] leading-snug text-espresso transition-colors group-hover:text-forest sm:text-[23px]">
          {product.name}
        </h3>
      </Link>
      <div className="mt-1 flex items-center justify-between gap-3">
        {price !== null && <p className="tabular text-[15px] text-espresso">{formatMoney(price)}</p>}
        {variants.length > 1 && (
          <ul className="flex items-center gap-1.5" aria-label={`${variants.length} colours`}>
            {variants.slice(0, 4).map((v) => (
              <li key={v.id}>
                <Link
                  href={`${href}?colour=${slugColour(v.colour_name)}`}
                  aria-label={`${product.name} in ${v.colour_name}${v.stock <= 0 ? ", back soon" : ""}`}
                  className="relative block h-4 w-4 border border-espresso/20"
                  style={{ backgroundColor: v.colour_hex }}
                >
                  {v.stock <= 0 && (
                    <span aria-hidden className="absolute inset-0 bg-[linear-gradient(135deg,transparent_45%,var(--color-ivory)_45%,var(--color-ivory)_55%,transparent_55%)]" />
                  )}
                </Link>
              </li>
            ))}
            {variants.length > 4 && <li className="text-[12px] text-muted">+{variants.length - 4}</li>}
          </ul>
        )}
        {variants.length === 1 && <p className="text-[13px] text-muted">{variants[0].colour_name}</p>}
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  empty,
}: Readonly<{ products: ProductWithImages[]; empty?: React.ReactNode }>) {
  if (products.length === 0) return <>{empty}</>;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 2} />
      ))}
    </div>
  );
}
