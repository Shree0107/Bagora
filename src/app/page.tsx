import Image from "next/image";
import Link from "next/link";
import { button, container, eyebrow } from "@/components/ui/styles";
import { ProductCard } from "@/components/product/ProductCard";
import { getCategories, getFeaturedProducts } from "@/lib/data/catalog";

export default async function HomePage() {
  const [categories, featured] = await Promise.all([getCategories(), getFeaturedProducts(3)]);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-sand/70">
        <div className={`${container} grid items-center gap-10 py-12 md:grid-cols-2 md:py-20`}>
          <div className="order-2 md:order-1">
            <p className={eyebrow}>New season · Crafted leather</p>
            <h1 className="mt-5 text-5xl leading-[1.05] text-espresso sm:text-6xl lg:text-7xl">
              Carried daily.
              <br />
              <span className="italic text-cognac">Loved for years.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              Totes, crossbody and shoulder bags in warm browns, cognac and deep oxblood, designed
              to soften and age beautifully with you.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/shop" className={button.primary}>
                Shop the collection
              </Link>
              <Link href="#categories" className={button.secondary}>
                Browse categories
              </Link>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-ivory sm:aspect-[5/5] md:aspect-[4/5]">
              <Image
                src="/products/heritage-leather-tote.jpg"
                alt="Heritage leather tote in oxblood"
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className={`${container} scroll-mt-20 py-20`}>
        <div className="text-center">
          <p className={eyebrow}>Shop by style</p>
          <h2 className="mt-3 text-4xl text-espresso sm:text-5xl">Find your shape</h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {categories.map((c) => (
            <Link key={c.id} href={`/shop/${c.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-ivory">
                {c.image_url && (
                  <Image
                    src={c.image_url}
                    alt={c.name}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-espresso/0 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-cream">
                  <h3 className="text-3xl">{c.name}</h3>
                  <p className="mt-1 text-sm text-cream/80 underline-offset-4 group-hover:underline">Shop now →</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="bg-ivory/60 py-20">
          <div className={container}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className={eyebrow}>Editor&apos;s picks</p>
                <h2 className="mt-3 text-4xl text-espresso sm:text-5xl">Featured bags</h2>
              </div>
              <Link href="/shop" className="hidden text-sm text-cognac hover:underline sm:inline">
                View all
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promise strip */}
      <section className={`${container} grid gap-8 py-20 text-center sm:grid-cols-3`}>
        {[
          ["Free shipping", "On every order, across Europe."],
          ["Secure checkout", "Payments handled by Stripe."],
          ["Made to last", "Materials chosen to age well."],
        ].map(([title, text]) => (
          <div key={title}>
            <p className="font-serif text-2xl text-espresso">{title}</p>
            <p className="mt-2 text-sm text-muted">{text}</p>
          </div>
        ))}
      </section>
    </>
  );
}
