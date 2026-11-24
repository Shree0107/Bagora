"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { BagIcon } from "./Icons";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      className="relative flex h-11 items-center gap-2 pl-1 text-sage transition-colors hover:text-gilt-pale"
      aria-label={count ? `Shopping bag, ${count} ${count === 1 ? "item" : "items"}` : "Shopping bag, empty"}
    >
      <BagIcon />
      {count > 0 && (
        <span className="tabular absolute top-1.5 -right-2 flex h-[18px] min-w-[18px] items-center justify-center bg-gilt px-1 text-[10px] font-medium text-forest-deep">
          {count}
        </span>
      )}
    </Link>
  );
}
