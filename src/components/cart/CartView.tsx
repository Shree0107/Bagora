"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";
import { ProductImage } from "@/components/product/ProductImage";
import { FormMessage } from "@/components/ui/FormMessage";
import { button } from "@/components/ui/styles";
import { getCartDetailsAction } from "@/lib/cart/actions";
import type { CartLineDetails } from "@/lib/cart/types";
import { MAX_QTY_PER_ITEM } from "@/lib/config";
import { formatPrice } from "@/lib/format";

export function CartView() {
  const { lines, isLoggedIn, setQuantity, remove } = useCart();
  // Product details keyed by the cart contents they were fetched for.
  const [details, setDetails] = useState<{ key: string; items: CartLineDetails[] } | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const key = lines.map((l) => `${l.productId}:${l.quantity}`).join(",");

  // Load fresh prices/stock from the server whenever the cart changes.
  useEffect(() => {
    let cancelled = false;
    getCartDetailsAction(lines)
      .then((items) => !cancelled && setDetails({ key, items }))
      .catch(() => !cancelled && setDetails({ key, items: [] }));
    return () => {
      cancelled = true;
    };
    // `key` captures the relevant content of `lines`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-serif text-3xl text-saddle">Your bag is empty</p>
        <p className="mt-3 text-sm text-muted">Find something you&apos;ll carry for years.</p>
        <Link href="/shop" className={`${button.primary} mt-8`}>
          Continue shopping
        </Link>
      </div>
    );
  }

  const loading = !details;
  const fresh = details?.key === key;
  // Use quantities from the live cart (instant UI) and product data from the server.
  const qtyById = new Map(lines.map((l) => [l.productId, l.quantity]));
  const items = (details?.items ?? [])
    .filter((i) => qtyById.has(i.productId))
    .map((i) => ({ ...i, quantity: qtyById.get(i.productId)! }));
  const subtotal = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const unavailable = fresh ? lines.filter((l) => !items.some((i) => i.productId === l.productId)) : [];
  const overStock = items.filter((i) => i.quantity > i.stock);
  const canCheckout = fresh && items.length > 0 && overStock.length === 0 && unavailable.length === 0;

  async function checkout() {
    setCheckoutError(null);
    setRedirecting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines }),
      });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed. Please try again.");
      window.location.assign(data.url);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed.");
      setRedirecting(false);
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y divide-sand border-y border-sand">
        {loading && <li className="py-8 text-sm text-muted">Loading your bag…</li>}
        {items.map((item) => (
          <li key={item.productId} className="flex gap-4 py-6 sm:gap-6">
            <Link href={`/products/${item.slug}`} className="w-24 shrink-0 sm:w-32">
              <ProductImage src={item.imageUrl} alt={item.name} sizes="128px" className="rounded-sm" />
            </Link>
            <div className="flex flex-1 flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/products/${item.slug}`} className="font-serif text-xl text-espresso hover:text-cognac">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted">{formatPrice(item.priceCents)}</p>
                  {item.quantity > item.stock && (
                    <p className="mt-1 text-xs text-danger">
                      {item.stock === 0 ? "Sold out — please remove." : `Only ${item.stock} available.`}
                    </p>
                  )}
                </div>
                <p className="text-sm text-espresso tabular-nums">{formatPrice(item.priceCents * item.quantity)}</p>
              </div>
              <div className="flex items-center justify-between">
                <QuantityStepper
                  value={item.quantity}
                  max={Math.max(item.quantity > item.stock ? item.quantity : 1, Math.min(item.stock, MAX_QTY_PER_ITEM))}
                  onChange={(q) => setQuantity(item.productId, q, Math.min(item.stock, MAX_QTY_PER_ITEM))}
                />
                <button
                  type="button"
                  onClick={() => remove(item.productId)}
                  className="text-xs uppercase tracking-wider text-muted hover:text-danger"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
        {unavailable.map((l) => (
          <li key={l.productId} className="flex items-center justify-between py-6 text-sm text-muted">
            This item is no longer available.
            <button type="button" onClick={() => remove(l.productId)} className="text-cognac hover:underline">
              Remove
            </button>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-sm bg-ivory p-6 sm:p-8">
        <h2 className="text-2xl text-espresso">Summary</h2>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{loading ? "—" : formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd>Free</dd>
          </div>
          <div className="flex justify-between border-t border-sand pt-3 text-base">
            <dt>Total</dt>
            <dd className="tabular-nums">{loading ? "—" : formatPrice(subtotal)}</dd>
          </div>
        </dl>

        <div className="mt-6 space-y-3">
          <FormMessage error={checkoutError} />
          {isLoggedIn ? (
            <button
              type="button"
              onClick={checkout}
              disabled={!canCheckout || redirecting}
              className={`${button.primary} w-full`}
            >
              {redirecting ? "Redirecting to payment…" : "Checkout"}
            </button>
          ) : (
            <>
              <Link href="/login?next=/cart" className={`${button.primary} w-full`}>
                Log in to checkout
              </Link>
              <p className="text-center text-xs text-muted">
                New here?{" "}
                <Link href="/signup?next=/cart" className="text-cognac underline underline-offset-4">
                  Create an account
                </Link>
                . Your bag will be saved.
              </p>
            </>
          )}
          <p className="text-center text-xs text-muted">Secure payment by Stripe. Prices include VAT.</p>
        </div>
      </aside>
    </div>
  );
}
