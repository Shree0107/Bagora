"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { button } from "@/components/ui/styles";
import { MAX_QTY_PER_ITEM } from "@/lib/config";
import { QuantityStepper } from "@/components/cart/QuantityStepper";

export function AddToCart({ productId, stock }: { productId: string; stock: number }) {
  const { add, lines } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const inCart = lines.find((l) => l.productId === productId)?.quantity ?? 0;
  const maxAddable = Math.max(0, Math.min(stock, MAX_QTY_PER_ITEM) - inCart);

  if (stock <= 0) {
    return (
      <button type="button" disabled className={`${button.primary} w-full`}>
        Sold out
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <QuantityStepper value={Math.min(qty, Math.max(1, maxAddable))} max={Math.max(1, maxAddable)} onChange={setQty} />
        <button
          type="button"
          disabled={maxAddable === 0}
          onClick={() => {
            add(productId, Math.min(qty, maxAddable), Math.min(stock, MAX_QTY_PER_ITEM));
            setAdded(true);
            setQty(1);
            setTimeout(() => setAdded(false), 2500);
          }}
          className={`${button.primary} flex-1`}
        >
          {maxAddable === 0 ? "Maximum in bag" : added ? "Added ✓" : "Add to bag"}
        </button>
      </div>
      {added && (
        <p className="text-sm text-saddle" role="status">
          Added to your bag.{" "}
          <Link href="/cart" className="text-cognac underline underline-offset-4">
            View bag
          </Link>
        </p>
      )}
    </div>
  );
}
