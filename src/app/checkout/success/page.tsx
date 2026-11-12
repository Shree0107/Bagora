import type { Metadata } from "next";
import Link from "next/link";
import { container, button, eyebrow } from "@/components/ui/styles";
import { OrderSummary } from "@/components/order/OrderSummary";
import { SuccessEffects } from "@/components/order/SuccessEffects";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

export default async function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const { session_id } = await searchParams;
  const sessionId = typeof session_id === "string" ? session_id : "";
  await requireUser(`/checkout/success?session_id=${encodeURIComponent(sessionId)}`);

  // RLS guarantees users can only read their own order.
  const supabase = await createClient();
  const { data: order } = sessionId
    ? await supabase.from("orders").select("*, order_items(*)").eq("stripe_session_id", sessionId).maybeSingle()
    : { data: null };

  if (!order) {
    return (
      <div className={`${container} max-w-2xl py-20 text-center`}>
        <h1 className="text-4xl text-espresso">We couldn&apos;t find that order</h1>
        <p className="mt-4 text-muted">If you were charged, your order will appear in your account shortly.</p>
        <Link href="/account" className={`${button.primary} mt-8`}>
          Go to my account
        </Link>
      </div>
    );
  }

  const pending = order.status === "pending";
  const { order_items, ...orderRow } = order;

  return (
    <div className={`${container} max-w-3xl py-14 sm:py-20`}>
      <SuccessEffects pending={pending} />
      <div className="text-center">
        <p className={eyebrow}>Thank you</p>
        <h1 className="mt-3 text-4xl text-espresso sm:text-5xl">Your order is confirmed</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          {pending
            ? "We're confirming your payment. This usually takes a few seconds…"
            : `A receipt has been sent to ${order.email}. We'll let you know when it ships.`}
        </p>
      </div>

      <div className="mt-12 rounded-sm bg-ivory/60 p-6 sm:p-10">
        <OrderSummary order={orderRow} items={order_items} />
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/account" className={button.secondary}>
          View my orders
        </Link>
        <Link href="/shop" className={button.primary}>
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
