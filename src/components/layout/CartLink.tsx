"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-2 text-sm text-saddle hover:text-cognac"
      aria-label={`Shopping bag, ${count} item${count === 1 ? "" : "s"}`}
    >
      <BagIcon />
      <span className="hidden sm:inline">Bag</span>
      {count > 0 && (
        <span className="absolute -top-2 -right-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cognac px-1 text-[10px] font-semibold text-cream sm:static sm:h-5">
          {count}
        </span>
      )}
    </Link>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M5 8h14l-1 12H6L5 8Z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </svg>
  );
}
