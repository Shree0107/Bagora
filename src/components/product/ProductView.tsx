"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Gallery } from "./Gallery";
import { AddToCart } from "./AddToCart";
import { WhatsAppHint } from "./WhatsAppHint";
import { StarIcon } from "@/components/layout/Icons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { PREPAID_DISCOUNT_RATE } from "@/lib/config";

type Img = { id: string; url: string; alt: string; variant_id: string | null };
type Variant = { id: string; colour_name: string; colour_hex: string; stock: number; slug: string };

/**
 * The product's gallery + purchase panel. Owns the chosen colour: swatches
 * switch the photographs and stock, and the URL (?colour=) so the choice can be shared.
 */
export function ProductView({
  productId,
  name,
  categoryName,
  price,
  images,
  variants,
  initialVariantId,
  rating,
  whatsapp,
  children,
}: Readonly<{
  productId: string;
  name: string;
  categoryName: string | null;
  price: number | null;
  images: Img[];
  variants: Variant[];
  initialVariantId: string | null;
  rating: { average: number; count: number } | null;
  whatsapp: string | null;
  children: React.ReactNode;
}>) {
  const { money } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [variantId, setVariantId] = useState(initialVariantId);
  const variant = variants.find((v) => v.id === variantId) ?? variants[0] ?? null;

  const own = images.filter((i) => variant && i.variant_id === variant.id);
  const shared = images.filter((i) => !i.variant_id);
  const shown = own.length ? [...own, ...shared] : shared.length ? shared : images;

  function choose(v: Variant) {
    setVariantId(v.id);
    router.replace(`${pathname}?colour=${v.slug}`, { scroll: false });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7">
        <Gallery images={shown} name={variant ? `${name} in ${variant.colour_name}` : name} />
      </div>

      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-28">
          {categoryName && <p className="text-[15px] text-muted">{categoryName}</p>}
          <h1 className="mt-1 font-display text-[clamp(2.4rem,4.5vw,3.75rem)] leading-[1.02] text-espresso">{name}</h1>

          {rating && (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-muted hover:text-espresso">
              <span className="flex text-gilt-ink" aria-hidden>
                {[1, 2, 3, 4, 5].map((n) => (
                  <StarIcon key={n} filled={n <= Math.round(rating.average)} />
                ))}
              </span>
              <span className="tabular">
                {rating.average.toFixed(1)} · {rating.count} {rating.count === 1 ? "review" : "reviews"}
              </span>
            </a>
          )}

          {price !== null ? (
            <div className="mt-5">
              <p className="tabular text-2xl text-espresso">{money(price)}</p>
              <p className="mt-1 text-sm text-muted">
                Inclusive of GST. {Math.round(PREPAID_DISCOUNT_RATE * 100)}% off when you pay online.
              </p>
            </div>
          ) : (
            <p className="mt-5 text-muted">Not available to order at the moment.</p>
          )}

          {variants.length > 0 && (
            <fieldset className="mt-8">
              <legend className="text-[15px] text-espresso">
                Colour: <span className="text-muted">{variant?.colour_name}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {variants.map((v) => {
                  const active = v.id === variant?.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => choose(v)}
                      aria-pressed={active}
                      aria-label={`${v.colour_name}${v.stock <= 0 ? ", back soon" : ""}`}
                      title={v.colour_name}
                      className={`relative h-11 w-11 border transition-[outline-color] ${
                        active ? "border-forest outline outline-1 outline-offset-[3px] outline-forest" : "border-espresso/20 hover:border-espresso/50"
                      }`}
                      style={{ backgroundColor: v.colour_hex }}
                    >
                      {v.stock <= 0 && (
                        <span
                          aria-hidden
                          className="absolute inset-0 bg-[linear-gradient(135deg,transparent_47%,var(--color-ivory)_47%,var(--color-ivory)_53%,transparent_53%)]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {variant && price !== null && (
            <div className="mt-8">
              <AddToCart
                key={variant.id}
                productId={productId}
                variantId={variant.id}
                stock={variant.stock}
                colourName={variant.colour_name}
              />
            </div>
          )}
          {whatsapp && <WhatsAppHint number={whatsapp} message={`Hello VÉRANE, I have a question about ${name}${variant ? ` (${variant.colour_name})` : ""}.`} />}

          <div className="mt-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
