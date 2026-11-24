import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { container, button } from "@/components/ui/styles";
import { OrderSummary } from "@/components/order/OrderSummary";
import { SuccessEffects } from "@/components/order/SuccessEffects";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { invoiceSettings } from "@/lib/env";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

export default async function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const params = await searchParams;
  const orderId = z.uuid().safeParse(params.order).data ?? "";
  await requireUser(`/checkout/success?order=${orderId}`);

  // RLS guarantees users can only read their own order.
  const supabase = await createClient();
  const { data: order } = orderId
    ? await supabase.from("orders").select("*, order_items(*)").eq("id", orderId).maybeSingle()
    : { data: null };

  if (!order) {
    return (
      <div className={`${container} max-w-2xl py-24 text-center`}>
        <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none text-espresso">We couldn&apos;t find that order</h1>
        <p className="mt-5 text-[17px] text-muted">Your orders are always listed in your account.</p>
        <Link href="/account" className={`${button.primary} mt-8`}>My orders</Link>
      </div>
    );
  }

  const cod = order.payment_provider === "cod";
  const awaitingPayment = !cod && order.payment_status !== "paid";
  const { order_items, ...orderRow } = order;

  return (
    <div className="bg-ivory">
      <div className={`${container} max-w-3xl py-16 sm:py-24`}>
        <SuccessEffects pending={awaitingPayment} />
        <div className="text-center">
          <h1 className="font-display text-[clamp(2.75rem,7vw,5rem)] leading-none text-espresso italic">Merci.</h1>
          <p className="mx-auto mt-6 max-w-md text-[17px] leading-relaxed text-muted">
            {awaitingPayment
              ? "We're confirming your payment with Razorpay. This page updates by itself in a few seconds."
              : cod
                ? "Your order is confirmed. Please keep the amount ready in cash or UPI when your bag arrives."
                : "Your payment is confirmed and your bag is being prepared. Razorpay emails you a payment receipt."}
          </p>
        </div>

        <div className="mt-14 bg-ivory-deep p-6 sm:p-10">
          <OrderSummary order={orderRow} items={order_items} />
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href={`/account/orders/${order.id}`} className={button.secondary}>View order</Link>
          {invoiceSettings() && !awaitingPayment && (
            <Link href={`/account/orders/${order.id}/invoice`} className={button.secondary}>GST invoice</Link>
          )}
          <Link href="/shop" className={button.primary}>Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
