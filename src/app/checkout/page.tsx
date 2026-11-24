import type { Metadata } from "next";
import { container } from "@/components/ui/styles";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getCurrentProfile, requireUser } from "@/lib/auth";
import { isRazorpayConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const profile = await getCurrentProfile();

  return (
    <div className="bg-ivory">
      <div className={`${container} py-12 sm:py-16`}>
        <h1 className="mb-12 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-none text-espresso">Checkout</h1>
        <CheckoutForm email={user.email ?? ""} defaultName={profile?.full_name ?? ""} onlineAvailable={isRazorpayConfigured()} />
      </div>
    </div>
  );
}
