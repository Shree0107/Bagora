import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/content/InfoPage";
import { RETURN_DAYS } from "@/lib/config";

export const metadata: Metadata = {
  title: "Shipping & returns",
  description: `Free delivery across India, cash on delivery, and easy returns within ${RETURN_DAYS} days.`,
  alternates: { canonical: "/shipping-returns" },
};

// ⚠️ Owner to review with your courier and accountant before launch (timelines, refunds, exceptions).
export default function ShippingReturnsPage() {
  return (
    <InfoPage title="Shipping & returns" intro="Free delivery across India, and returns that are simple when something isn't right.">
      <h2>Delivery</h2>
      <ul>
        <li>Delivery is free on every order, anywhere in India we can reach.</li>
        <li>Orders are packed and handed to our courier partner after confirmation. You receive tracking details as soon as your bag ships.</li>
        <li>Delivery times depend on your PIN code. Metro cities are usually quicker than remote areas.</li>
        <li>For cash-on-delivery orders, please keep the amount ready in cash or UPI. The courier may call you before delivery.</li>
      </ul>

      <h2>Returns</h2>
      <p>
        If you change your mind, you can return a bag within <strong>{RETURN_DAYS} days of delivery</strong>, as long as it is
        unused, in its original condition, with its tags and packaging.
      </p>
      <ol>
        <li>Write to us through the <Link href="/contact">contact page</Link> with your order number.</li>
        <li>We arrange a pickup, or share the address to send it to.</li>
        <li>Once we receive and check the bag, we process your refund.</li>
      </ol>

      <h2>Refunds</h2>
      <ul>
        <li>Online payments are refunded to the original payment method through Razorpay.</li>
        <li>Cash-on-delivery orders are refunded by bank transfer or UPI to an account you share with us.</li>
        <li>Your bank may take a few working days to show the refund.</li>
      </ul>

      <h2>Damaged or wrong item</h2>
      <p>
        If your bag arrives damaged or isn&apos;t what you ordered, write to us within 48 hours of delivery with your order number
        and a photo. We&apos;ll replace it or refund you in full, including any return shipping.
      </p>
    </InfoPage>
  );
}
