"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart/CartProvider";

/**
 * Runs on the order success page:
 *  - empties the cart once
 *  - while the webhook hasn't marked the order paid yet, refreshes the page
 *    every 3 seconds (max ~30s)
 */
export function SuccessEffects({ pending }: { pending: boolean }) {
  const { clear } = useCart();
  const router = useRouter();
  const cleared = useRef(false);
  const tries = useRef(0);

  useEffect(() => {
    if (cleared.current) return;
    cleared.current = true;
    clear();
  }, [clear]);

  useEffect(() => {
    if (!pending || tries.current >= 10) return;
    const t = setTimeout(() => {
      tries.current += 1;
      router.refresh();
    }, 3000);
    return () => clearTimeout(t);
  }, [pending, router]);

  return null;
}
