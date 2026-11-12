import { NextResponse } from "next/server";
import { z } from "zod";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/env";
import { CURRENCY, MAX_QTY_PER_ITEM, SHIPPING_COUNTRIES } from "@/lib/config";

/**
 * POST /api/checkout
 * Body: { items: [{ productId, quantity }] }  — NO prices are accepted.
 *
 * 1. Requires a logged-in user.
 * 2. Loads every product from the database and checks it is active and in stock.
 * 3. Computes the total from database prices.
 * 4. Creates a "pending" order + order items (secret key, bypasses RLS).
 * 5. Creates a Stripe Checkout Session and returns its URL.
 * The order is marked "paid" later by the Stripe webhook, never here.
 */

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().min(1).max(MAX_QTY_PER_ITEM),
      }),
    )
    .min(1)
    .max(50),
});

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  // 1. Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return fail("Please log in to check out.", 401);

  // 2. Validate input
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Your bag looks invalid. Please refresh and try again.");

  // Merge duplicate lines, just in case.
  const quantities = new Map<string, number>();
  for (const i of parsed.data.items) {
    quantities.set(i.productId, (quantities.get(i.productId) ?? 0) + i.quantity);
  }

  const admin = createAdminClient();
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, name, slug, price_cents, stock, is_active, product_images(url, sort_order)")
    .in("id", [...quantities.keys()]);
  if (productsError) return fail("Could not load products. Please try again.", 500);

  // 3. Server-side price + stock checks
  const lines = [];
  for (const [productId, quantity] of quantities) {
    const p = products.find((x) => x.id === productId);
    if (!p || !p.is_active) return fail("An item in your bag is no longer available. Please remove it.");
    if (quantity > p.stock) {
      return fail(
        p.stock === 0 ? `"${p.name}" is sold out.` : `Only ${p.stock} of "${p.name}" left. Please update your bag.`,
      );
    }
    const image = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
    lines.push({ product: p, quantity, image });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.product.price_cents * l.quantity, 0);
  const shipping = 0; // free shipping
  const total = subtotal + shipping;
  if (total < 50) return fail("Order total is too low to process."); // Stripe minimum is €0.50

  // 4. Create the pending order
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      email: user.email,
      status: "pending",
      subtotal_cents: subtotal,
      shipping_cents: shipping,
      total_cents: total,
      currency: CURRENCY,
    })
    .select("id")
    .single();
  if (orderError || !order) return fail("Could not create your order. Please try again.", 500);

  const { error: itemsError } = await admin.from("order_items").insert(
    lines.map((l) => ({
      order_id: order.id,
      product_id: l.product.id,
      product_name: l.product.name,
      product_slug: l.product.slug,
      image_url: l.image,
      unit_price_cents: l.product.price_cents,
      quantity: l.quantity,
    })),
  );
  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return fail("Could not create your order. Please try again.", 500);
  }

  // 5. Stripe Checkout Session
  const base = siteUrl();
  // Stripe can only show product images from public https URLs.
  const absoluteImage = (url: string | null) => {
    if (!url) return undefined;
    const full = url.startsWith("http") ? url : `${base}${url}`;
    return full.startsWith("https://") ? [full] : undefined;
  };

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      client_reference_id: order.id,
      metadata: { order_id: order.id, user_id: user.id },
      payment_intent_data: { metadata: { order_id: order.id } },
      line_items: lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: CURRENCY,
          unit_amount: l.product.price_cents,
          product_data: { name: l.product.name, images: absoluteImage(l.image) },
        },
      })),
      shipping_address_collection: { allowed_countries: [...SHIPPING_COUNTRIES] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: "Free shipping",
            fixed_amount: { amount: shipping, currency: CURRENCY },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
      ],
      success_url: `${base}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout/cancel`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    });
  } catch (err) {
    console.error("Stripe session error", err);
    await admin.from("orders").delete().eq("id", order.id);
    return fail("Payment could not be started. Please try again.", 502);
  }

  await admin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

  if (!session.url) return fail("Payment could not be started. Please try again.", 502);
  return NextResponse.json({ url: session.url });
}
