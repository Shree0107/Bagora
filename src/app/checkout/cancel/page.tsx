import type { Metadata } from "next";
import Link from "next/link";
import { button, container } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Checkout cancelled", robots: { index: false } };

export default function CheckoutCancelPage() {
  return (
    <div className={`${container} max-w-xl py-24 text-center`}>
      <h1 className="text-4xl text-espresso sm:text-5xl">Checkout cancelled</h1>
      <p className="mt-4 text-muted">
        No payment was taken. Your bag is still saved, so you can pick up where you left off.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/cart" className={button.primary}>
          Return to bag
        </Link>
        <Link href="/shop" className={button.secondary}>
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
