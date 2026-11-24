"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { useCartDetails } from "./useCartDetails";
import { QuantityStepper } from "./QuantityStepper";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ProductImage } from "@/components/product/ProductImage";
import { CashIcon, LockIcon, ReceiptIcon, ReturnIcon, TruckIcon } from "@/components/layout/Icons";
import { button } from "@/components/ui/styles";
import { MAX_QTY_PER_ITEM, PREPAID_DISCOUNT_RATE, RETURN_DAYS } from "@/lib/config";

export function CartView() {
  const { setQuantity, remove, isLoggedIn, isPending } = useCart();
  const { money } = useLocale();
  const { lines, items, loading, subtotal, prepaidDiscount, unavailable, overStock, canCheckout } = useCartDetails();

  if (lines.length === 0) {
    return (
      <div className="border border-line px-6 py-20 text-center sm:py-28">
        <p className="font-display text-[clamp(2rem,5vw,3rem)] text-espresso">Your bag is waiting</p>
        <p className="mx-auto mt-3 max-w-sm text-[17px] text-muted">Nothing here yet. Find the one you&apos;ll carry every day.</p>
        <Link href="/shop" className={`${button.primary} mt-8`}>
          Discover the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
      <section aria-label="Items in your bag">
        {loading && <p className="text-muted">Loading your bag…</p>}
        <ul className="divide-y divide-line border-y border-line">
          {items.map((i) => {
            const max = Math.min(i.stock, MAX_QTY_PER_ITEM);
            const ref = { productId: i.productId, variantId: i.variantId };
            return (
              <li key={i.variantId} className="flex gap-4 py-6 sm:gap-6">
                <Link href={`/products/${i.slug}`} className="w-24 shrink-0 sm:w-32">
                  <ProductImage src={i.imageUrl} alt={i.name} sizes="128px" zoom={false} />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link href={`/products/${i.slug}`} className="font-display text-[22px] leading-tight text-espresso hover:text-forest">
                        {i.name}
                      </Link>
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                        <span aria-hidden className="h-3 w-3 border border-espresso/20" style={{ backgroundColor: i.colourHex }} />
                        {i.colourName}
                      </p>
                    </div>
                    <p className="tabular text-[15px] text-espresso">{money(i.priceCents * i.quantity)}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-4 pt-4">
                    <QuantityStepper
                      value={i.quantity}
                      max={Math.max(max, i.quantity)}
                      onChange={(q) => setQuantity(ref, q, max)}
                      disabled={isPending && isLoggedIn}
                      label={`${i.name}, ${i.colourName}`}
                    />
                    <button type="button" onClick={() => remove(ref)} className="min-h-11 text-sm text-muted underline underline-offset-4 hover:text-espresso">
                      Remove
                    </button>
                  </div>
                  {i.quantity > i.stock && (
                    <p className="mt-2 text-sm text-danger">
                      {i.stock === 0 ? "This colour has just sold out." : `Only ${i.stock} left. Please reduce the quantity.`}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {unavailable.length > 0 && (
          <p className="mt-4 text-sm text-danger">
            {unavailable.length === 1 ? "One item is" : `${unavailable.length} items are`} no longer available and won&apos;t be ordered.{" "}
            <button type="button" className="underline" onClick={() => unavailable.forEach((l) => remove(l))}>
              Remove
            </button>
          </p>
        )}
        <ul className="mt-10 grid gap-4 text-[14px] text-espresso sm:grid-cols-2">
          <li className="flex items-center gap-3"><TruckIcon className="text-forest" /> Free delivery across India</li>
          <li className="flex items-center gap-3"><ReturnIcon className="text-forest" /> Easy returns within {RETURN_DAYS} days</li>
          <li className="flex items-center gap-3"><CashIcon className="text-forest" /> Cash on delivery available</li>
          <li className="flex items-center gap-3"><ReceiptIcon className="text-forest" /> GST invoice with your order</li>
        </ul>
      </section>

      <aside className="h-fit bg-ivory-deep p-6 sm:p-8 lg:sticky lg:top-28" aria-labelledby="bag-summary">
        <h2 id="bag-summary" className="font-display text-[28px] leading-none text-espresso">Summary</h2>
        <dl className="tabular mt-6 space-y-2.5 text-[15px]">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{loading ? "…" : money(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>Free</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-lg"><dt>Total</dt><dd>{loading ? "…" : money(subtotal)}</dd></div>
          <p className="text-[13px] text-muted">Prices include GST.</p>
        </dl>
        {prepaidDiscount > 0 && (
          <p className="mt-5 border border-forest/30 bg-white/50 px-4 py-3 text-sm text-forest">
            Pay online at checkout and save {money(prepaidDiscount)} ({Math.round(PREPAID_DISCOUNT_RATE * 100)}% off).
          </p>
        )}
        {overStock.length > 0 && <p className="mt-4 text-sm text-danger">Please adjust the quantities marked above.</p>}
        {canCheckout ? (
          <Link href={isLoggedIn ? "/checkout" : "/login?next=/checkout"} className={`${button.primary} mt-6 w-full`}>
            {isLoggedIn ? "Checkout" : "Sign in to checkout"}
          </Link>
        ) : (
          <button type="button" disabled className={`${button.primary} mt-6 w-full`}>Checkout</button>
        )}
        <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-muted">
          <LockIcon size={15} className="text-forest" /> Secure checkout · UPI, cards, netbanking, COD
        </p>
        <Link href="/shop" className="mt-5 block text-center text-sm text-forest underline decoration-gilt underline-offset-4">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
