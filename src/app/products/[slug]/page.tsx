import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { container } from "@/components/ui/styles";
import { Gallery } from "@/components/product/Gallery";
import { AddToCart } from "@/components/product/AddToCart";
import { ProductCard } from "@/components/product/ProductCard";
import { getProductBySlug, getProducts } from "@/lib/data/catalog";
import { formatPrice } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Product not found" };
  const image = product.product_images[0]?.url;
  return {
    title: product.name,
    description: product.description.slice(0, 155),
    openGraph: image ? { images: [image] } : undefined,
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = product.categories
    ? (await getProducts({ categorySlug: product.categories.slug })).filter((p) => p.id !== product.id).slice(0, 3)
    : [];

  const stockText =
    product.stock <= 0 ? "Sold out" : product.stock <= 3 ? `Only ${product.stock} left` : "In stock";

  return (
    <div className={`${container} py-10 sm:py-14`}>
      <nav aria-label="Breadcrumb" className="mb-8 text-xs uppercase tracking-[0.15em] text-muted">
        <Link href="/shop" className="hover:text-cognac">Shop</Link>
        {product.categories && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/shop/${product.categories.slug}`} className="hover:text-cognac">
              {product.categories.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <Gallery images={product.product_images} name={product.name} />

        <div className="md:sticky md:top-24 md:self-start">
          <h1 className="text-4xl leading-tight text-espresso sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-2xl text-saddle">{formatPrice(product.price_cents)}</p>
          <p className={`mt-2 text-sm ${product.stock <= 0 ? "text-danger" : "text-success"}`}>{stockText}</p>

          <p className="mt-8 leading-relaxed whitespace-pre-line text-muted">{product.description}</p>

          <div className="mt-10">
            <AddToCart productId={product.id} stock={product.stock} />
          </div>

          <ul className="mt-10 space-y-3 border-t border-sand pt-6 text-sm text-saddle">
            <li>· Free shipping on every order</li>
            <li>· Secure payment with Stripe</li>
            <li>· Dispatched within 2–3 working days</li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="text-3xl text-espresso">You may also like</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
