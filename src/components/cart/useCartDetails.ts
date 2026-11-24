"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { getCartDetailsAction } from "@/lib/cart/actions";
import type { CartLineDetails } from "@/lib/cart/types";
import { PREPAID_DISCOUNT_RATE } from "@/lib/config";

/**
 * Cart lines joined with fresh product data (price, colour, stock, image) from
 * the server. Shared by the cart and checkout pages.
 */
export function useCartDetails() {
  const { lines } = useCart();
  // Product details keyed by the cart contents they were fetched for.
  const [details, setDetails] = useState<{ key: string; items: CartLineDetails[] } | null>(null);
  const key = lines.map((l) => `${l.variantId}:${l.quantity}`).join(",");

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

  const loading = !details;
  const fresh = details?.key === key;
  // Quantities from the live cart (instant UI), product data from the server.
  const qtyByVariant = new Map(lines.map((l) => [l.variantId, l.quantity]));
  const items = (details?.items ?? [])
    .filter((i) => qtyByVariant.has(i.variantId))
    .map((i) => ({ ...i, quantity: qtyByVariant.get(i.variantId)! }));
  const subtotal = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const prepaidDiscount = prepaidDiscountFor(subtotal);
  // Items removed or deactivated since they were added.
  const unavailable = fresh ? lines.filter((l) => l.variantId && !items.some((i) => i.variantId === l.variantId)) : [];
  const overStock = items.filter((i) => i.quantity > i.stock);
  const canCheckout = fresh && items.length > 0 && overStock.length === 0 && unavailable.length === 0;

  return { lines, items, loading, fresh, subtotal, prepaidDiscount, unavailable, overStock, canCheckout };
}

/** Same rounding as the server (/api/checkout). */
export function prepaidDiscountFor(subtotal: number): number {
  return Math.round((subtotal * PREPAID_DISCOUNT_RATE) / 100) * 100;
}
