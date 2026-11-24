import "server-only";
import type { Payments } from "razorpay/dist/types/payments";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpay } from "@/lib/razorpay";

/**
 * Server-side Razorpay payment confirmation shared by the webhook and the
 * verify endpoint. Every path ends in the database function
 * confirm_order_payment(), which re-checks provider + amount + currency and
 * is idempotent (a payment can never be applied twice).
 *
 * Logs contain order ids and provider ids only — never card data, addresses
 * or secrets.
 */

export type ConfirmResult = "paid" | "pending" | "failed";

/**
 * Razorpay: confirm a payment after fetching it from Razorpay's API
 * (never trust what the browser says). Captures authorised payments.
 */
export async function confirmRazorpayPayment(orderId: string, paymentId: string): Promise<ConfirmResult> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, market, currency, total_cents, payment_status, razorpay_order_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || !order.razorpay_order_id) {
    throw new Error(`Order ${orderId} is not a Razorpay order`);
  }
  if (order.payment_status === "paid") return "paid";

  const rzp = getRazorpay();
  let payment: Payments.RazorpayPayment = await rzp.payments.fetch(paymentId);

  if (payment.order_id !== order.razorpay_order_id) {
    throw new Error(`Razorpay payment ${paymentId} does not belong to order ${orderId}`);
  }
  if (Number(payment.amount) !== order.total_cents || String(payment.currency).toLowerCase() !== "inr") {
    throw new Error(`Razorpay amount/currency mismatch for order ${orderId}`);
  }

  if (payment.status === "authorized") {
    // Accounts without auto-capture: capture the exact order amount.
    payment = await rzp.payments.capture(paymentId, order.total_cents, "INR");
  }

  if (payment.status === "failed") {
    await markPaymentFailed(orderId);
    return "failed";
  }
  if (payment.status !== "captured") return "pending";

  const { error } = await admin.rpc("confirm_order_payment", {
    p_order_id: orderId,
    p_provider: "razorpay",
    p_amount: Number(payment.amount),
    p_currency: "inr",
    p_payment_ref: payment.id,
    p_payment_method: payment.method ?? null,
  });
  if (error) throw new Error(`confirm_order_payment failed for order ${orderId}: ${error.message}`);
  return "paid";
}

/** A payment attempt failed. The order stays open so the customer can retry. */
export async function markPaymentFailed(orderId: string): Promise<void> {
  await createAdminClient()
    .from("orders")
    .update({ payment_status: "failed" })
    .eq("id", orderId)
    .in("payment_status", ["pending", "failed"]);
}

/** Checkout expired / abandoned: cancel the order if it was never paid. */
export async function cancelUnpaidOrder(orderId: string): Promise<void> {
  await createAdminClient()
    .from("orders")
    .update({ status: "cancelled", payment_status: "cancelled" })
    .eq("id", orderId)
    .in("payment_status", ["pending", "failed"]);
}
