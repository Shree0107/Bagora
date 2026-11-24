"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { primaryImage, imagesForVariant } from "@/lib/data/catalog";
import { priceFor } from "@/lib/markets";
import { MAX_QTY_PER_ITEM } from "@/lib/config";
import type { ProductWithImages } from "@/types/database";
import type { CartLine, CartLineDetails } from "./types";

const lineSchema = z.object({
  productId: z.uuid(),
  variantId: z.union([z.uuid(), z.literal("")]),
  quantity: z.number().int().min(0).max(99),
});
const linesSchema = z.array(lineSchema).max(50);

const PRODUCT_SELECT =
  "*, product_images(id, url, alt, sort_order, variant_id), product_variants(id, colour_name, colour_hex, colour_family, stock, sort_order, is_active)" as const;

/** Server Actions for the cart. Saved carts (logged in) live in cart_items. */

async function getUserOrThrow() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not logged in");
  return { supabase, userId: data.user.id };
}

async function loadProducts(ids: string[]): Promise<Map<string, ProductWithImages>> {
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", [...new Set(ids)])
    .eq("is_active", true);
  if (error) throw new Error(`Could not load cart products: ${error.message}`);
  return new Map(
    (data as ProductWithImages[]).map((p) => [
      p.id,
      {
        ...p,
        product_images: [...p.product_images].sort((a, b) => a.sort_order - b.sort_order),
        product_variants: p.product_variants.filter((v) => v.is_active).sort((a, b) => a.sort_order - b.sort_order),
      },
    ]),
  );
}

/** The variant a line points at (empty id = the product's default colour). */
function variantOf(p: ProductWithImages | undefined, variantId: string) {
  if (!p) return undefined;
  return variantId ? p.product_variants.find((v) => v.id === variantId) : p.product_variants[0];
}

const clamp = (qty: number, stock: number | undefined) => Math.max(0, Math.min(qty, stock ?? 0, MAX_QTY_PER_ITEM));

async function readLines(): Promise<CartLine[]> {
  const { supabase } = await getUserOrThrow();
  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id, variant_id, quantity")
    .order("created_at");
  if (error) throw new Error(error.message);
  return data.map((r) => ({ productId: r.product_id, variantId: r.variant_id, quantity: r.quantity }));
}

/** Set the quantity of one colour of a bag (0 removes it). Returns the new cart. */
export async function setCartQuantityAction(productId: string, variantId: string, quantity: number): Promise<CartLine[]> {
  const line = lineSchema.parse({ productId, variantId, quantity });
  const { supabase, userId } = await getUserOrThrow();
  const variant = variantOf((await loadProducts([line.productId])).get(line.productId), line.variantId);
  const qty = clamp(line.quantity, variant?.stock);

  if (qty === 0 || !variant) {
    const id = variant?.id ?? line.variantId;
    if (id) await supabase.from("cart_items").delete().eq("variant_id", id).eq("user_id", userId);
  } else {
    const { error } = await supabase
      .from("cart_items")
      .upsert(
        { user_id: userId, product_id: line.productId, variant_id: variant.id, quantity: qty },
        { onConflict: "user_id,variant_id" },
      );
    if (error) throw new Error(error.message);
  }
  return readLines();
}

/** Add to the existing quantity. Returns the new cart. */
export async function addToCartAction(productId: string, variantId: string, quantity: number): Promise<CartLine[]> {
  const line = lineSchema.parse({ productId, variantId, quantity });
  const current = (await readLines()).find((l) => l.variantId === line.variantId)?.quantity ?? 0;
  return setCartQuantityAction(line.productId, line.variantId, current + line.quantity);
}

/** After login: merge the guest (browser) cart into the saved cart. */
export async function mergeGuestCartAction(guestLines: CartLine[]): Promise<CartLine[]> {
  const lines = linesSchema.parse(guestLines);
  const { supabase, userId } = await getUserOrThrow();
  const saved = await readLines();
  if (lines.length === 0) return saved;

  const products = await loadProducts([...saved, ...lines].map((l) => l.productId));
  const merged = new Map<string, { productId: string; quantity: number }>();
  for (const l of [...saved, ...lines]) {
    const v = variantOf(products.get(l.productId), l.variantId);
    if (!v) continue;
    const prev = merged.get(v.id)?.quantity ?? 0;
    merged.set(v.id, { productId: l.productId, quantity: prev + l.quantity });
  }

  const rows = [...merged.entries()]
    .map(([variant_id, { productId, quantity }]) => {
      const stock = products.get(productId)?.product_variants.find((v) => v.id === variant_id)?.stock;
      return { user_id: userId, product_id: productId, variant_id, quantity: clamp(quantity, stock) };
    })
    .filter((r) => r.quantity > 0);

  if (rows.length > 0) {
    const { error } = await supabase.from("cart_items").upsert(rows, { onConflict: "user_id,variant_id" });
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

/**
 * Fresh product data (name, colour, price, stock, image) for the cart and
 * checkout. Works for guests too. Lines with an empty variantId (old carts)
 * come back resolved to the default colour. Inactive products are left out.
 */
export async function getCartDetailsAction(lines: CartLine[]): Promise<CartLineDetails[]> {
  const parsed = linesSchema.parse(lines);
  const products = await loadProducts(parsed.map((l) => l.productId));

  return parsed.flatMap((l) => {
    const p = products.get(l.productId);
    const v = variantOf(p, l.variantId);
    const price = p ? priceFor(p) : null;
    if (!p || !v || price === null) return [];
    return [
      {
        productId: p.id,
        variantId: v.id,
        quantity: l.quantity,
        name: p.name,
        slug: p.slug,
        colourName: v.colour_name,
        colourHex: v.colour_hex,
        priceCents: price,
        stock: v.stock,
        imageUrl: imagesForVariant(p, v.id)[0]?.url ?? primaryImage(p),
      },
    ];
  });
}
