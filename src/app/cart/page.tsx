import type { Metadata } from "next";
import { container } from "@/components/ui/styles";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="bg-ivory">
      <div className={`${container} py-12 sm:py-16`}>
        <h1 className="mb-12 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-none text-espresso">Your bag</h1>
        <CartView />
      </div>
    </div>
  );
}
