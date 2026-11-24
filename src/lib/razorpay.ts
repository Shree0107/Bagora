import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret } from "@/lib/env";

let client: Razorpay | null = null;

/** Lazily created Razorpay client (server only). */
export function getRazorpay(): Razorpay {
  if (!client) client = new Razorpay({ key_id: razorpayKeyId(), key_secret: razorpayKeySecret() });
  return client;
}

/** Constant-time comparison of two hex HMAC digests. */
function safeEqualHex(expected: string, received: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Checkout signature check (Razorpay docs: HMAC-SHA256 of
 * "<razorpay_order_id>|<razorpay_payment_id>" with the Key Secret).
 */
export function verifyCheckoutSignature(razorpayOrderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", razorpayKeySecret())
    .update(`${razorpayOrderId}|${paymentId}`)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhook signature check: HMAC-SHA256 of the RAW body with the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = crypto.createHmac("sha256", razorpayWebhookSecret()).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
