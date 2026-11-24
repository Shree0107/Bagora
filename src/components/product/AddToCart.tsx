"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { button } from "@/components/ui/styles";
import { MAX_QTY_PER_ITEM } from "@/lib/config";

/** Add one colour of a bag to the bag. Quantity lives in the bag page. */
export function AddToCart({
  productId,
  variantId,
  stock,
  colourName,
}: Readonly<{ productId: string; variantId: string; stock: number; colourName: string }>) {
  const { add, lines } = useCart();
  const [added, setAdded] = useState(false);

  const inCart = lines.find((l) => l.variantId === variantId)?.quantity ?? 0;
  const max = Math.min(stock, MAX_QTY_PER_ITEM);
  const canAdd = inCart < max;

  if (stock <= 0) {
    return (
      <div>
        <button type="button" disabled className={`${button.primary} w-full`}>
          {colourName}: back soon
        </button>
        <p className="mt-3 text-sm text-muted">This colour is being remade. Choose another colour, or ask us when it returns.</p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={!canAdd}
        onClick={() => {
          add({ productId, variantId }, 1, max);
          setAdded(true);
          window.setTimeout(() => setAdded(false), 3000);
        }}
        className={`${button.primary} w-full`}
      >
        {canAdd ? (added ? "Added to your bag" : "Add to bag") : "All available pieces are in your bag"}
      </button>
      <p className="mt-3 min-h-6 text-sm text-muted" role="status" aria-live="polite">
        {added && (
          <>
            {colourName} is in your bag.{" "}
            <Link href="/cart" className="text-forest underline decoration-gilt underline-offset-4">
              View bag
            </Link>
          </>
        )}
        {!added && stock <= 3 && `Only ${stock} left in ${colourName}.`}
      </p>
    </div>
  );
}
