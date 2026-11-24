import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { confirmRazorpayPayment } from "@/lib/payments";

/**
 * POST /api/razorpay/verify — called by the browser after Razorpay Checkout
 * reports success. We do NOT trust that report:
 *  1. the order must belong to the logged-in user and match the Razorpay order,
 *  2. the HMAC signature must verify with our Key Secret,
 *  3. the payment is fetched from Razorpay's API and its amount/currency/status
 *     checked (and captured if only authorised) before the order is marked paid.
 * The Razorpay webhook does the same independently, in case the browser closes.
 */
const schema = z.object({
  orderId: z.uuid(),
  razorpay_order_id: z.string().regex(/^order_\w{6,40}$/),
  razorpay_payment_id: z.string().regex(/^pay_\w{6,40}$/),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (!(await rateLimit(`rzp-verify:${user.id}`, 20, 600))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const body = parsed.data;

  const { data: order } = await createAdminClient()
    .from("orders")
    .select("id, user_id, razorpay_order_id")
    .eq("id", body.orderId)
    .maybeSingle();
  if (!order || order.user_id !== user.id || order.razorpay_order_id !== body.razorpay_order_id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!verifyCheckoutSignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)) {
    console.warn(`Invalid Razorpay signature for order ${order.id}`);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    const status = await confirmRazorpayPayment(order.id, body.razorpay_payment_id);
    return NextResponse.json({ status }, { status: status === "failed" ? 402 : 200 });
  } catch (err) {
    console.error(`Razorpay verify failed for order ${order.id}:`, err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "verify_failed" }, { status: 502 });
  }
}
