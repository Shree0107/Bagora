import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { confirmRazorpayPayment, markPaymentFailed } from "@/lib/payments";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/razorpay/webhook — India / INR payments.
 * Configure in Razorpay Dashboard → Webhooks with the events:
 *   payment.authorized, payment.captured, payment.failed, order.paid
 * The signature (x-razorpay-signature) is an HMAC of the RAW body with the
 * webhook secret. Confirmation re-fetches the payment from Razorpay's API and
 * is idempotent, so duplicate deliveries are harmless.
 */
type PaymentEntity = { id: string; order_id: string; notes?: Record<string, string> | [] };
type WebhookEvent = {
  event: string;
  payload?: { payment?: { entity: PaymentEntity } };
};

export async function POST(request: Request) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const signature = request.headers.get("x-razorpay-signature");
  const body = await request.text();
  if (!signature || !verifyWebhookSignature(body, signature)) {
    console.error("Razorpay webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(body) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment) return NextResponse.json({ received: true }); // event we don't use

  try {
    const orderId = await findOrderId(payment);
    if (!orderId) {
      console.warn(`Razorpay ${event.event}: no matching order for ${payment.order_id}`);
      return NextResponse.json({ received: true });
    }

    switch (event.event) {
      case "payment.authorized":
      case "payment.captured":
      case "order.paid":
        await confirmRazorpayPayment(orderId, payment.id);
        break;
      case "payment.failed":
        await markPaymentFailed(orderId);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`Razorpay webhook ${event.event} failed:`, err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/** Our order id: from the Razorpay order notes, or by looking up the Razorpay order id. */
async function findOrderId(payment: PaymentEntity): Promise<string | null> {
  const notes = Array.isArray(payment.notes) ? undefined : payment.notes;
  const { data } = await createAdminClient()
    .from("orders")
    .select("id")
    .eq("razorpay_order_id", payment.order_id)
    .maybeSingle();
  if (data) return data.id;
  return notes?.order_id && /^[0-9a-f-]{36}$/.test(notes.order_id) ? notes.order_id : null;
}
