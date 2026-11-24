import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpay } from "@/lib/razorpay";
import { isRazorpayConfigured, razorpayKeyId } from "@/lib/env";
import { getLocale } from "@/lib/locale";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_QTY_PER_ITEM, PREPAID_DISCOUNT_RATE, STORE_NAME } from "@/lib/config";
import { includedTax, priceFor } from "@/lib/markets";
import { getShippingMethod, shippingCost } from "@/lib/shipping";
import { toOrderAddress, validateAddress } from "@/lib/address";
import type { Order } from "@/types/database";

/**
 * POST /api/checkout: create an order, then either a Razorpay payment
 * (online, prepaid discount) or a Cash-on-Delivery order.
 *
 * Body: { items: [{productId, variantId, quantity}], address, shippingMethod, paymentMethod, checkoutKey }
 * NO prices, discounts or shipping costs are accepted from the browser.
 *
 *  1. Logged-in user, rate-limited.
 *  2. Address validated server-side (India rules).
 *  3. Idempotent: the same checkoutKey returns the same order (no double orders).
 *  4. Prices and stock per colour re-loaded from the database.
 *  5. Online: 5% prepaid discount, Razorpay order; paid only after server-side
 *     verification (/api/razorpay/verify or the webhook).
 *     COD: place_cod_order() reserves stock and confirms the order at once.
 */

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        variantId: z.uuid(),
        quantity: z.number().int().min(1).max(MAX_QTY_PER_ITEM),
      }),
    )
    .min(1)
    .max(50),
  address: z.unknown(),
  shippingMethod: z.string().max(40),
  paymentMethod: z.enum(["razorpay", "cod"]),
  checkoutKey: z.uuid(),
});

type Fail = { error: string; code?: string; fieldErrors?: Record<string, string> };
const fail = (body: Fail, status = 400) => NextResponse.json(body, { status });

/** 5% of the subtotal, rounded to the rupee (same as the cart preview). */
function prepaidDiscount(subtotal: number): number {
  return Math.round((subtotal * PREPAID_DISCOUNT_RATE) / 100) * 100;
}

export async function POST(request: Request) {
  const { t } = await getLocale();

  // 1. Auth + rate limit
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return fail({ error: t("cart.loginToCheckout"), code: "auth" }, 401);
  if (!(await rateLimit(`checkout:${user.id}`, 10, 600))) {
    return fail({ error: t("auth.err.generic"), code: "rate_limited" }, 429);
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail({ error: t("auth.err.form") });
  const { items, shippingMethod: methodId, paymentMethod, checkoutKey } = parsed.data;

  if (paymentMethod === "razorpay" && !isRazorpayConfigured()) {
    console.error("Checkout blocked: Razorpay is not configured");
    return fail({ error: t("checkout.onlineUnavailable"), code: "payments_unavailable" }, 503);
  }

  // 2. Address (server-side, same rules as the form)
  const addr = validateAddress(parsed.data.address);
  if (!addr.ok) {
    const fieldErrors = Object.fromEntries(Object.entries(addr.errors).map(([k, key]) => [k, t(key as string)]));
    return fail({ error: t("checkout.fixErrors"), code: "address", fieldErrors });
  }
  const method = getShippingMethod(methodId);
  if (!method) return fail({ error: t("auth.err.form") });

  const admin = createAdminClient();

  // 3. Idempotency: same checkout attempt -> same order
  const existing = await findByCheckoutKey(user.id, checkoutKey);
  if (existing) return resumeExisting(existing, user.email);

  // 4. Products, colours, prices and stock from the database
  const quantities = new Map<string, { productId: string; quantity: number }>();
  for (const i of items) {
    const prev = quantities.get(i.variantId)?.quantity ?? 0;
    quantities.set(i.variantId, { productId: i.productId, quantity: prev + i.quantity });
  }

  const { data: variants, error: variantsError } = await admin
    .from("product_variants")
    .select(
      "id, product_id, colour_name, stock, is_active, products!inner(id, name, slug, price_inr_paise, is_active, product_images(url, sort_order, variant_id))",
    )
    .in("id", [...quantities.keys()]);
  if (variantsError) return fail({ error: t("auth.err.generic") }, 500);

  const lines = [];
  for (const [variantId, { productId, quantity }] of quantities) {
    const v = variants.find((x) => x.id === variantId);
    const p = v?.products as unknown as
      | { id: string; name: string; slug: string; price_inr_paise: number | null; is_active: boolean; product_images: { url: string; sort_order: number; variant_id: string | null }[] }
      | undefined;
    const price = p ? priceFor(p) : null;
    if (!v || !p || p.id !== productId || !v.is_active || !p.is_active || price === null) {
      return fail({ error: t("cart.unavailable"), code: "unavailable" });
    }
    if (quantity > v.stock) {
      return fail({
        error:
          v.stock === 0
            ? `${p.name} (${v.colour_name}): ${t("product.soldOut")}`
            : `${p.name} (${v.colour_name}): ${t("cart.onlyAvailable", { count: v.stock })}`,
        code: "stock",
      });
    }
    const imgs = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order);
    const image = (imgs.find((i) => i.variant_id === v.id) ?? imgs.find((i) => !i.variant_id) ?? imgs[0])?.url ?? null;
    lines.push({ product: p, variant: v, price, quantity, image });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const shipping = shippingCost(method, subtotal);
  const discount = paymentMethod === "razorpay" ? prepaidDiscount(subtotal) : 0;
  const total = subtotal + shipping - discount;
  if (total < 100) return fail({ error: t("auth.err.generic") }); // Razorpay minimum ₹1

  // 5a. Pending order
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      email: user.email,
      market: "in",
      language: "en",
      currency: "inr",
      payment_provider: paymentMethod,
      subtotal_cents: subtotal,
      shipping_cents: shipping,
      discount_cents: discount,
      tax_cents: includedTax(total),
      prices_include_tax: true,
      total_cents: total,
      shipping_method: method.id,
      shipping_address: toOrderAddress(addr.address),
      checkout_key: checkoutKey,
    })
    .select("*")
    .single();

  if (orderError) {
    // Unique (user_id, checkout_key): a parallel duplicate request won the race.
    if (orderError.code === "23505") {
      const winner = await findByCheckoutKey(user.id, checkoutKey);
      if (winner) return resumeExisting(winner, user.email);
    }
    console.error("order insert failed:", orderError.code);
    return fail({ error: t("auth.err.generic") }, 500);
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    lines.map((l) => ({
      order_id: order.id,
      product_id: l.product.id,
      variant_id: l.variant.id,
      colour_name: l.variant.colour_name,
      product_name: l.product.name,
      product_slug: l.product.slug,
      image_url: l.image,
      unit_price_cents: l.price,
      quantity: l.quantity,
    })),
  );
  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return fail({ error: t("auth.err.generic") }, 500);
  }

  // 5b. Cash on Delivery: reserve stock + confirm now.
  if (paymentMethod === "cod") {
    const { error } = await admin.rpc("place_cod_order", { p_order_id: order.id });
    if (error) {
      await admin.from("orders").delete().eq("id", order.id);
      const stock = error.message.includes("insufficient_stock");
      return fail({ error: stock ? t("checkout.stockChanged") : t("auth.err.generic"), code: stock ? "stock" : "cod_error" }, stock ? 409 : 500);
    }
    return NextResponse.json({ provider: "cod", orderId: order.id });
  }

  // 5c. Online: Razorpay order
  try {
    const rzpOrder = await getRazorpay().orders.create({
      amount: total,
      currency: "INR",
      receipt: order.id.slice(0, 40),
      notes: { order_id: order.id },
    });
    await admin.from("orders").update({ razorpay_order_id: rzpOrder.id }).eq("id", order.id);
    return NextResponse.json(razorpayPayload({ ...order, razorpay_order_id: rzpOrder.id }, user.email));
  } catch (err) {
    console.error(`razorpay order error for ${order.id}:`, err instanceof Error ? err.message : "unknown");
    await admin.from("orders").delete().eq("id", order.id);
    return fail({ error: t("auth.err.generic"), code: "provider_error" }, 502);
  }
}

async function findByCheckoutKey(userId: string, key: string): Promise<Order | null> {
  const { data } = await createAdminClient()
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .eq("checkout_key", key)
    .maybeSingle();
  return data;
}

/** Same checkout attempt submitted again (double click / retry): reuse it. */
async function resumeExisting(order: Order, email: string) {
  if (order.payment_status === "paid") return NextResponse.json({ alreadyPaid: true, orderId: order.id });
  if (order.status === "cancelled") return fail({ error: "expired", code: "expired" }, 409);
  if (order.payment_provider === "cod" && order.status !== "pending") {
    return NextResponse.json({ provider: "cod", orderId: order.id });
  }
  if (order.payment_provider === "razorpay" && order.razorpay_order_id) {
    return NextResponse.json(razorpayPayload(order, email));
  }
  return fail({ error: "expired", code: "expired" }, 409);
}

function razorpayPayload(order: Order, email: string) {
  const addr = order.shipping_address as { name?: string; phone?: string } | null;
  return {
    provider: "razorpay" as const,
    orderId: order.id,
    keyId: razorpayKeyId(),
    razorpayOrderId: order.razorpay_order_id,
    amount: order.total_cents,
    currency: "INR",
    name: STORE_NAME,
    prefill: { name: addr?.name ?? "", email, contact: addr?.phone ?? "" },
  };
}
