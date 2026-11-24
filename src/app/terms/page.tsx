import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/content/InfoPage";
import { PREPAID_DISCOUNT_RATE, RETURN_DAYS } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms of sale",
  description: "The terms that apply when you shop at VÉRANE.",
  alternates: { canonical: "/terms" },
};

// ⚠️ TEMPLATE. Have this reviewed by a lawyer and add your legal entity, address and governing jurisdiction before launch.
export default function TermsPage() {
  const pct = Math.round(PREPAID_DISCOUNT_RATE * 100);
  return (
    <InfoPage title="Terms of sale" intro="Plain terms for buying from VÉRANE. If anything is unclear, ask us.">
      <h2>Prices</h2>
      <p>All prices are in Indian rupees (₹) and include GST. Delivery within India is free.</p>
      <p>
        Orders paid online receive a {pct}% discount on the subtotal, shown before you pay. Cash-on-delivery orders are charged at
        the listed price.
      </p>

      <h2>Orders</h2>
      <p>
        Your order is confirmed when your online payment is verified, or, for cash on delivery, when you place it. We may cancel
        an order if an item becomes unavailable or a price was shown in error; any payment is then refunded in full.
      </p>

      <h2>Payment</h2>
      <p>Online payments are processed securely by Razorpay (UPI, cards, netbanking and wallets). Cash-on-delivery orders are paid to the courier.</p>

      <h2>Delivery</h2>
      <p>We deliver across India. Delivery times depend on your location; tracking is shared once your order ships.</p>

      <h2>Returns &amp; refunds</h2>
      <p>
        Unused bags in original condition can be returned within {RETURN_DAYS} days of delivery. See{" "}
        <Link href="/shipping-returns">Shipping &amp; returns</Link> for how it works.
      </p>

      <h2>Products</h2>
      <p>
        Genuine leather is a natural material, so grain and colour vary slightly from bag to bag and from photographs. These
        variations are not defects.
      </p>

      <h2>Reviews</h2>
      <p>Reviews can be written only by customers who received the bag. We may hide reviews that are abusive or unrelated to the product.</p>

      <h2>Contact</h2>
      <p>Questions about these terms? <Link href="/contact">Contact us</Link>.</p>
    </InfoPage>
  );
}
