"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getProductsByIds, primaryImage } from "@/lib/data/catalog";
import { MAX_QTY_PER_ITEM } from "@/lib/config";
import type { CartLine, CartLineDetails } from "./types";

const lineSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().min(0).max(99),
});
const linesSchema = z.array(lineSchema).max(50);

/** Server Actions for the logged-in user's saved cart (cart_items table). */

async function getUserOrThrow() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not logged in");
  return { supabase, userId: data.user.id };
}

/** Clamp a quantity to what is actually available. */
async function stockMap(ids: string[]) {
  const products = await getProductsByIds(ids);
  return new Map(products.map((p) => [p.id, p.stock]));
}

function clamp(qty: number, stock: number | undefined) {
  return Math.max(0, Math.min(qty, stock ?? 0, MAX_QTY_PER_ITEM));
}

async function readLines(): Promise<CartLine[]> {
  const { supabase } = await getUserOrThrow();
  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id, quantity")
    .order("created_at");
  if (error) throw new Error(error.message);
  return data.map((r) => ({ productId: r.product_id, quantity: r.quantity }));
}

/** Set the quantity of one product (0 removes it). Returns the new cart. */
export async function setCartQuantityAction(productId: string, quantity: number): Promise<CartLine[]> {
  const line = lineSchema.parse({ productId, quantity });
  const { supabase, userId } = await getUserOrThrow();
  const stock = await stockMap([line.productId]);
  const qty = clamp(line.quantity, stock.get(line.productId));

  if (qty === 0) {
    await supabase.from("cart_items").delete().eq("product_id", line.productId).eq("user_id", userId);
  } else {
    const { error } = await supabase
      .from("cart_items")
      .upsert(
        { user_id: userId, product_id: line.productId, quantity: qty },
        { onConflict: "user_id,product_id" },
      );
    if (error) throw new Error(error.message);
  }
  return readLines();
}

/** Add to the existing quantity. Returns the new cart. */
export async function addToCartAction(productId: string, quantity: number): Promise<CartLine[]> {
  const line = lineSchema.parse({ productId, quantity });
  const current = (await readLines()).find((l) => l.productId === line.productId)?.quantity ?? 0;
  return setCartQuantityAction(line.productId, current + line.quantity);
}

/** After login: merge the guest (browser) cart into the saved cart. */
export async function mergeGuestCartAction(guestLines: CartLine[]): Promise<CartLine[]> {
  const lines = linesSchema.parse(guestLines);
  const { supabase, userId } = await getUserOrThrow();
  const saved = await readLines();
  if (lines.length === 0) return saved;

  const merged = new Map(saved.map((l) => [l.productId, l.quantity]));
  for (const l of lines) merged.set(l.productId, (merged.get(l.productId) ?? 0) + l.quantity);

  const stock = await stockMap([...merged.keys()]);
  const rows = [...merged.entries()]
    .map(([product_id, q]) => ({ user_id: userId, product_id, quantity: clamp(q, stock.get(product_id)) }))
    .filter((r) => r.quantity > 0);

  if (rows.length > 0) {
    const { error } = await supabase.from("cart_items").upsert(rows, { onConflict: "user_id,product_id" });
    if (error) throw new Error(error.message);
  }
  return readLines();
}

/** Empty the saved cart (after a successful order). */
export async function clearCartAction(): Promise<CartLine[]> {
  const { supabase, userId } = await getUserOrThrow();
  await supabase.from("cart_items").delete().eq("user_id", userId);
  return [];
}

/** Fresh product data (name, price, stock, image) for the cart page. Works for guests too. */
export async function getCartDetailsAction(lines: CartLine[]): Promise<CartLineDetails[]> {
  const parsed = linesSchema.parse(lines);
  const products = await getProductsByIds(parsed.map((l) => l.productId));
  const byId = new Map(products.map((p) => [p.id, p]));

  return parsed.flatMap((l) => {
    const p = byId.get(l.productId);
    if (!p) return []; // product removed or deactivated
    return [
      {
        productId: p.id,
        quantity: l.quantity,
        name: p.name,
        slug: p.slug,
        priceCents: p.price_cents,
        stock: p.stock,
        imageUrl: primaryImage(p),
      },
    ];
  });
}
