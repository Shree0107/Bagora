import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { button, container } from "@/components/ui/styles";
import { STORE_TAGLINE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Our story",
  description: "VÉRANE comes from the French véritable: genuine. Genuine leather handbags, crafted in India and priced honestly.",
  alternates: { canonical: "/our-story" },
};

// ⚠️ Owner to review: every statement here should be true of your workshop and suppliers.
const PROMISES = [
  { title: "Genuine leather", text: "Every VÉRANE bag is made from real leather. We name the leather on every product page, so you always know what you are carrying." },
  { title: "Made to be used", text: "Bags are designed for everyday life: room for a phone, a laptop or a bottle where it matters, and straps that sit comfortably." },
  { title: "An honest price", text: "Quality you can feel, at a price that respects you. Every price includes GST, with no surprises at checkout." },
  { title: "Looked after", text: "Questions before or after you buy? Write to us. If a bag isn't right, returns are simple." },
];

export default function OurStoryPage() {
  return (
    <div className="bg-ivory">
      {/* Window band */}
      <section className="bg-forest text-ivory">
        <div className={`${container} grid items-end gap-10 py-16 sm:py-24 lg:grid-cols-12`}>
          <div className="lg:col-span-7">
            <h1 className="font-display text-[clamp(3rem,9vw,7rem)] leading-[0.92]">
              Genuine,<br />
              <em className="text-gilt">by name.</em>
            </h1>
          </div>
          <p className="max-w-md text-[17px] leading-relaxed text-sage lg:col-span-4 lg:col-start-9">
            VÉRANE takes its name from the French word <em className="text-ivory">véritable</em>: genuine, true. It is
            a promise we try to keep in everything we make.
          </p>
        </div>
        <div className="moulding h-[5px]" aria-hidden />
      </section>

      {/* The name */}
      <section className={`${container} grid gap-12 py-20 sm:py-28 lg:grid-cols-12 lg:items-center`}>
        <div className="lg:col-span-5">
          <div className="window-frame relative aspect-[4/5] overflow-hidden bg-forest-deep">
            <Image
              src="/products/city-leather-backpack-3.webp"
              alt="Close-up of pebbled black leather and gold-tone zips"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.5rem)] leading-[1.05] text-espresso">The meaning of Vérane</h2>
          <div className="mt-6 space-y-5 text-[17px] leading-relaxed text-muted">
            <p>
              We wanted a name that said exactly what we stand for. <em>Véritable</em> means genuine; Vérane is our softer
              way of saying it. Genuine leather. Genuine care. A bag that is truly yours.
            </p>
            <p>
              Our tagline, <em className="text-espresso">{STORE_TAGLINE}</em>, means &ldquo;truly yours&rdquo;. It is how
              we hope you will feel the first time you carry one of our bags, and still feel years later.
            </p>
          </div>
        </div>
      </section>

      {/* Crafted in India */}
      <section className="bg-ivory-deep">
        <div className={`${container} grid gap-12 py-20 sm:py-28 lg:grid-cols-12 lg:items-center`}>
          <div className="lg:order-2 lg:col-span-5 lg:col-start-8">
            <div className="relative aspect-[4/5] overflow-hidden bg-plinth">
              <Image
                src="/products/heritage-leather-tote-1.webp"
                alt="The Héritage Tote in bordeaux leather"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="lg:order-1 lg:col-span-6">
            <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.5rem)] leading-[1.05] text-espresso">Crafted in India</h2>
            <div className="mt-6 space-y-5 text-[17px] leading-relaxed text-muted">
              <p>
                India has one of the world&apos;s great leather traditions. Our bags are made here, from genuine leather, by
                people who know how the material behaves: how it is cut, how it holds a seam, how its edges are finished.
              </p>
              <p>
                Making close to home also means we can keep prices honest and look after you properly, from the first
                question to the day your bag arrives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Promise */}
      <section className={`${container} py-20 sm:py-28`}>
        <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.5rem)] text-espresso">Our quality promise</h2>
        <ul className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2">
          {PROMISES.map((p) => (
            <li key={p.title} className="bg-ivory p-8 sm:p-10">
              <h3 className="font-display text-[26px] text-espresso">{p.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{p.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-14 flex flex-wrap gap-3">
          <Link href="/shop" className={button.primary}>Discover the collection</Link>
          <Link href="/contact" className={button.secondary}>Ask us anything</Link>
        </div>
      </section>
    </div>
  );
}
