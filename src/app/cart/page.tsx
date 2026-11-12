import type { Metadata } from "next";
import { container } from "@/components/ui/styles";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Your bag" };

export default function CartPage() {
  return (
    <div className={`${container} py-12 sm:py-16`}>
      <h1 className="mb-10 text-4xl text-espresso sm:text-5xl">Your bag</h1>
      <CartView />
    </div>
  );
}
