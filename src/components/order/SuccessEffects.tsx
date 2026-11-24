"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart/CartProvider";

/**
 * Runs on the order success page:
 *  - empties the bag once
 *  - for an online payment the server hasn't confirmed yet, refreshes every
 *    3 seconds (max ~30s) until the Razorpay webhook lands
 */
export function SuccessEffects({ pending }: Readonly<{ pending: boolean }>) {
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
