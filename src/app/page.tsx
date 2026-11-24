import Image from "next/image";
import Link from "next/link";
import { button, container, textLink } from "@/components/ui/styles";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { HomeMotion } from "@/components/home/HomeMotion";
import { NewsletterForm } from "@/components/home/NewsletterForm";
import { InstagramIcon } from "@/components/layout/Icons";
import { getCategories, getFeaturedProducts, slugColour } from "@/lib/data/catalog";
import { formatMoney, priceFor } from "@/lib/markets";
import { INSTAGRAM_HANDLE, STORE_TAGLINE } from "@/lib/config";

const HERO = "/products/hero-1.webp";

/** The Instagram grid shows our own photographs and links to the account (no API). */
const GRAM = [
  { src: "/products/city-leather-backpack-2.webp", alt: "The Cité Backpack, worn" },
  { src: "/products/heritage-leather-tote-1.webp", alt: "The Héritage Tote in bordeaux" },
  { src: "/products/cherry-charm-shoulder-bag-1.webp", alt: "The Cerise Shoulder Bag" },
  { src: "/products/city-leather-backpack-3.webp", alt: "Gold-tone zips on pebbled leather" },
  { src: "/products/saddle-crossbody-1.webp", alt: "The Selle Crossbody, worn" },
  { src: "/products/blush-charm-shoulder-bag-1.webp", alt: "The Poudre Shoulder Bag in crème" },
];

// ⚠️ Owner to confirm: describe your workshop's real process here.
const STAGES = [
  { name: "Cut", text: "Each panel is cut from genuine leather, chosen for the part of the bag it becomes." },
  { name: "Stitch", text: "Seams are stitched to hold their line through years of everyday use." },
  { name: "Edge", text: "Edges are finished until they are smooth to the touch." },
  { name: "Finish", text: "Hardware is fitted and each bag is checked before it is packed for you." },
];

export default async function HomePage() {
  const [categories, featured] = await Promise.all([getCategories(), getFeaturedProducts(4)]);
  // The signature piece: the featured bag with the most photographs.
  const signature = [...featured].sort((a, b) => b.product_images.length - a.product_images.length)[0];
  const signaturePrice = signature ? priceFor(signature) : null;

  return (
    <HomeMotion>
      {/* ───────────── The shop window ───────────── */}
      <section aria-labelledby="window-title" className="overflow-hidden bg-forest pb-6 sm:pb-10">
        <div data-window className="mx-auto max-w-7xl origin-top px-3 pt-3 sm:px-6 sm:pt-6 lg:px-10 lg:pt-8">
          <div className="window-frame relative overflow-hidden bg-forest-deep">
            <div className="grid lg:grid-cols-[1.15fr_1fr]">
              {/* Glass with lettering (desktop: left panes; mobile: over the photo) */}
              <div className="relative z-10 order-2 flex flex-col justify-end px-6 pt-0 pb-8 max-lg:-mt-[46%] sm:px-10 lg:order-1 lg:min-h-[min(78svh,760px)] lg:justify-center lg:border-r-[10px] lg:border-forest-deep lg:px-16 lg:py-20 lg:[background:radial-gradient(120%_80%_at_85%_40%,#2b4a3c_0%,#16291f_70%)]">
                <h1
                  id="window-title"
                  className="letter-in font-display text-[clamp(3rem,13vw,6rem)] leading-[0.95] text-ivory italic [--i:0]"
                >
                  {STORE_TAGLINE}
                </h1>
                <p className="letter-in mt-4 max-w-sm text-[15px] leading-relaxed text-gilt-pale [--i:1] sm:text-base">
                  Genuine leather handbags, crafted in India.
                  <span className="text-sage"> Truly yours.</span>
                </p>
                <div className="letter-in mt-8 [--i:2]">
                  <Link href="/shop" className={`${button.gilt} w-full sm:w-auto`}>
                    Discover the collection
                  </Link>
                </div>
              </div>

              {/* The lit display: the photograph */}
              <div className="relative order-1 aspect-[4/5] max-h-[78svh] w-full lg:order-2 lg:aspect-auto lg:max-h-none">
                <Image
                  src={HERO}
                  alt="A woman in a trench coat carrying the Cité Backpack in black leather"
                  fill
                  priority
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover object-[50%_30%]"
                />
                {/* window light: lifts the bag, darkens the lower glass for lettering on phones */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(to_top,#16291f_4%,rgb(22_41_31/0.55)_34%,transparent_62%)] lg:bg-[linear-gradient(100deg,rgb(22_41_31/0.35),transparent_35%)]"
                />
              </div>
            </div>
          </div>

          {/* The sill: the four shelves */}
          <nav aria-label="Shop by shelf" className="moulding mt-0 border-t-0">
            <ul className="grid grid-cols-2 sm:grid-cols-4">
              {categories.map((c, i) => (
                <li key={c.id} className={i % 2 ? "border-l border-gilt/30" : i ? "sm:border-l sm:border-gilt/30" : ""}>
                  <Link
                    href={`/shop/${c.slug}`}
                    className="plate-label flex min-h-14 items-center justify-center text-gilt-pale transition-colors hover:bg-forest-deep hover:text-ivory"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* ───────────── Inside: the name ───────────── */}
      <div data-interior className="relative bg-ivory">
        <section aria-labelledby="name-title" className={`${container} py-20 sm:py-28 lg:py-36`}>
          <div className="grid gap-10 lg:grid-cols-12">
            <h2
              id="name-title"
              className="font-display text-[clamp(2.4rem,6vw,4.75rem)] leading-[1.02] text-espresso lg:col-span-7"
            >
              Vérane comes from <em className="text-forest">véritable</em>. It means genuine.
            </h2>
            <div className="max-w-md self-end text-[17px] leading-relaxed text-muted lg:col-span-4 lg:col-start-9">
              <p>
                Real leather, honest construction, and a price that respects you. Every VÉRANE bag is made in India
                from genuine leather, to be carried every day and kept for years.
              </p>
              <Link href="/our-story" className={`${textLink} mt-6 inline-block text-[15px]`}>
                Read our story
              </Link>
            </div>
          </div>
        </section>

        {/* ───────────── The signature piece ───────────── */}
        {signature && (
          <section aria-labelledby="signature-title" className="bg-ivory-deep">
            <div className={`${container} grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-12 lg:gap-16`}>
              <Link href={`/products/${signature.slug}`} className="group block lg:col-span-6">
                <ProductImage
                  src={signature.product_images[1]?.url ?? signature.product_images[0]?.url ?? null}
                  alt={signature.product_images[1]?.alt ?? signature.name}
                  sizes="(min-width: 1024px) 45vw, 100vw"
                />
              </Link>
              <div className="lg:col-span-5 lg:col-start-8">
                <h2 id="signature-title" className="font-display text-[clamp(2.4rem,5vw,4rem)] leading-none text-espresso">
                  {signature.name}
                </h2>
                <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted">{firstSentences(signature.description)}</p>
                {signaturePrice !== null && (
                  <p className="tabular mt-6 text-lg text-espresso">
                    {formatMoney(signaturePrice)} <span className="text-sm text-muted">incl. GST</span>
                  </p>
                )}
                {signature.product_variants.length > 0 && (
                  <ul className="mt-5 flex flex-wrap gap-2" aria-label="Colours">
                    {signature.product_variants.map((v) => (
                      <li key={v.id}>
                        <Link
                          href={`/products/${signature.slug}?colour=${slugColour(v.colour_name)}`}
                          className="flex min-h-10 items-center gap-2 border border-line px-3 text-sm text-espresso hover:border-forest"
                        >
                          <span aria-hidden className="h-3.5 w-3.5 border border-espresso/20" style={{ backgroundColor: v.colour_hex }} />
                          {v.colour_name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <Link href={`/products/${signature.slug}`} className={`${button.primary} mt-9`}>
                  View the bag
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ───────────── The shelves ───────────── */}
        <section aria-labelledby="shelves-title" className={`${container} py-20 sm:py-28`}>
          <h2 id="shelves-title" className="font-display text-[clamp(2.2rem,4.5vw,3.5rem)] text-espresso">
            Choose your shape
          </h2>
          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/shop/${c.slug}`} className="group block">
                  <ProductImage src={c.image_url} alt={c.name} sizes="(min-width: 1024px) 22vw, 45vw" />
                  <div className="mt-4 flex items-baseline justify-between gap-3 border-b border-line pb-3 transition-colors group-hover:border-forest">
                    <h3 className="font-display text-[22px] text-espresso sm:text-[26px]">{c.name}</h3>
                    <span aria-hidden className="text-gilt-ink transition-transform duration-500 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                  <p className="mt-2 hidden text-sm text-muted sm:block">{c.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ───────────── Best-sellers ───────────── */}
        {featured.length > 0 && (
          <section aria-labelledby="best-title" className="border-t border-line py-20 sm:py-28">
            <div className={container}>
              <div className="flex items-end justify-between gap-6">
                <h2 id="best-title" className="font-display text-[clamp(2.2rem,4.5vw,3.5rem)] text-espresso">
                  Most loved
                </h2>
                <Link href="/shop" className={`${textLink} shrink-0 text-[15px]`}>
                  All bags
                </Link>
              </div>
            </div>
            <div className="mx-auto mt-10 max-w-7xl lg:px-10">
              <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] sm:gap-6 sm:px-6 lg:grid lg:grid-cols-4 lg:gap-8 lg:overflow-visible lg:px-0 lg:pb-0">
                {featured.map((p) => (
                  <li key={p.id} className="w-[72vw] shrink-0 snap-start sm:w-[40vw] lg:w-auto">
                    <ProductCard product={p} sizes="(min-width: 1024px) 22vw, 72vw" />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ───────────── Crafted in India ───────────── */}
        <section aria-labelledby="craft-title" className="bg-forest text-ivory">
          <div className="moulding h-[5px]" aria-hidden />
          <div className={`${container} py-20 sm:py-28`}>
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <h2 id="craft-title" className="font-display text-[clamp(2.4rem,5vw,4.25rem)] leading-[1.02] text-ivory">
                  Crafted in India, <em className="text-gilt">in four quiet steps</em>
                </h2>
                <p className="mt-6 max-w-md text-[17px] leading-relaxed text-sage">
                  Genuine leather asks for patience. These are the steps every VÉRANE bag passes through before it reaches you.
                </p>
              </div>
              <ol className="grid gap-px border border-gilt/30 bg-gilt/30 sm:grid-cols-2 lg:col-span-7">
                {STAGES.map((s) => (
                  <li key={s.name} className="bg-forest p-7 sm:p-9">
                    <h3 className="sign text-[22px] text-gilt">{s.name}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-sage">{s.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="moulding h-[5px]" aria-hidden />
        </section>

        {/* ───────────── Instagram ───────────── */}
        <section aria-labelledby="gram-title" className={`${container} py-20 sm:py-28`}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="gram-title" className="font-display text-[clamp(2.2rem,4.5vw,3.5rem)] text-espresso">
              VÉRANE, carried
            </h2>
            <a
              href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${textLink} inline-flex items-center gap-2 text-[15px]`}
            >
              <InstagramIcon size={18} />@{INSTAGRAM_HANDLE}
            </a>
          </div>
          <ul className="mt-10 grid grid-cols-3 gap-1.5 sm:gap-3 lg:grid-cols-6">
            {GRAM.map((g) => (
              <li key={g.src}>
                <a
                  href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${g.alt}, on Instagram`}
                  className="group relative block aspect-square overflow-hidden bg-ivory-deep"
                >
                  <Image
                    src={g.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 16vw, 33vw"
                    className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-quint)] motion-safe:group-hover:scale-[1.04]"
                  />
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* ───────────── Letters ───────────── */}
        <section aria-labelledby="letters-title" className="border-t border-line bg-ivory-deep">
          <div className={`${container} grid gap-10 py-20 sm:py-24 lg:grid-cols-12`}>
            <h2 id="letters-title" className="font-display text-[clamp(2.2rem,4.5vw,3.5rem)] leading-[1.05] text-espresso lg:col-span-6">
              Be the first to see what we make next.
            </h2>
            <div className="lg:col-span-5 lg:col-start-8 lg:self-end">
              <NewsletterForm tone="light" source="home" />
            </div>
          </div>
        </section>
      </div>
    </HomeMotion>
  );
}

function firstSentences(text: string, max = 2): string {
  const parts = text.split(/(?<=\.)\s+/);
  return parts.slice(0, max).join(" ");
}
