import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { stripeWebhookSecret } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

/**
 * POST /api/stripe/webhook
 * Stripe calls this after payment events. We verify the signature, then:
 *  - checkout.session.completed / async_payment_succeeded (paid)
 *      -> mark order paid + reduce stock (mark_order_paid SQL function)
 *  - checkout.session.expired / async_payment_failed
 *      -> mark order cancelled (only if still pending)
 * Returning a non-2xx status makes Stripe retry, so we only do that for
 * temporary failures. The SQL function is idempotent, so retries are safe.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  // The RAW body is required for signature verification.
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, stripeWebhookSecret());
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        if (session.payment_status === "paid") await handlePaid(session);
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        await handleCancelled(event.data.object);
        break;
      }
      default:
        // Other events are ignored.
        break;
    }
  } catch (err) {
    console.error(`Webhook handler failed for ${event.type}`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handlePaid(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    console.warn("Paid session without order_id metadata", session.id);
    return;
  }

  const admin = createAdminClient();

  // Sanity check: Stripe's total must match the total we calculated.
  const { data: order } = await admin.from("orders").select("total_cents").eq("id", orderId).maybeSingle();
  if (!order) throw new Error(`Order ${orderId} not found`);
  if (session.amount_total !== order.total_cents) {
    console.error(`Amount mismatch for order ${orderId}: stripe=${session.amount_total} db=${order.total_cents}`);
  }

  const shippingDetails = session.collected_information?.shipping_details ?? null;
  const paymentIntent =
    typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);

  const { error } = await admin.rpc("mark_order_paid", {
    p_order_id: orderId,
    p_session_id: session.id,
    p_payment_intent: paymentIntent,
    p_shipping: shippingDetails as unknown as Json,
  });
  if (error) throw new Error(`mark_order_paid failed: ${error.message}`);
}

async function handleCancelled(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;
  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("status", "pending");
  if (error) throw new Error(`Cancel order failed: ${error.message}`);
}
