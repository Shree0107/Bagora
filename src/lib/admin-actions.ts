"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/config";
import { slugify } from "@/lib/format";
import type { FormState } from "@/lib/auth-actions";
import { ORDER_STATUSES } from "@/lib/orders";
import type { ColourFamily } from "@/types/database";

/**
 * Admin-only Server Actions. Each one calls requireAdmin() first, and the
 * database RLS policies enforce the same rule a second time.
 */

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // keep in sync with next.config bodySizeLimit
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const FAMILIES = ["black", "brown", "tan", "burgundy", "green", "cream", "grey", "blue", "pink", "other"] as const satisfies readonly ColourFamily[];
const FITS = ["phone", "tablet", "laptop-13", "laptop-14", "laptop-16", "bottle", "a4"] as const;

const optionalNumber = (max: number) =>
  z.union([z.literal("").transform(() => null), z.coerce.number().positive().max(max)]).nullable();
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

const productSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Name is required.").max(120),
  slug: z.string().trim().max(120).optional(),
  categoryId: z.uuid("Please choose a category."),
  description: z.string().trim().max(5000),
  // Empty = not for sale yet.
  priceInr: z.union([z.literal(""), z.coerce.number().min(1, "Price must be at least ₹1.").max(1000000)]),
  styleRef: optionalText(20),
  width: optionalNumber(500),
  height: optionalNumber(500),
  depth: optionalNumber(500),
  strapDrop: optionalNumber(500),
  weight: optionalNumber(20000),
  fits: z.array(z.enum(FITS)),
  leather: optionalText(160),
  hardware: optionalText(160),
  lining: optionalText(160),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

const variantSchema = z.object({
  id: z.uuid().optional(),
  productId: z.uuid(),
  colourName: z.string().trim().min(1, "Colour name is required.").max(40),
  colourHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Choose a colour."),
  colourFamily: z.enum(FAMILIES),
  sku: optionalText(40),
  stock: z.coerce.number().int("Stock must be a whole number.").min(0).max(100000),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean(),
});

/** Extract the storage path from a public Storage URL (null for /products/... sample images). */
function storagePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

async function uploadImage(productId: string, file: File, alt: string, variantId: string | null) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Image must be JPG, PNG, WebP or AVIF.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be smaller than 4 MB.");

  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${productId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, variant_id: variantId, url: data.publicUrl, alt, sort_order: count ?? 0 });
  if (error) throw new Error(error.message);
}

export async function saveProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = productSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    categoryId: formData.get("categoryId"),
    description: formData.get("description") ?? "",
    priceInr: String(formData.get("priceInr") ?? "").trim(),
    styleRef: formData.get("styleRef") ?? "",
    width: formData.get("width") ?? "",
    height: formData.get("height") ?? "",
    depth: formData.get("depth") ?? "",
    strapDrop: formData.get("strapDrop") ?? "",
    weight: formData.get("weight") ?? "",
    fits: formData.getAll("fits"),
    leather: formData.get("leather") ?? "",
    hardware: formData.get("hardware") ?? "",
    lining: formData.get("lining") ?? "",
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };

  const v = parsed.data;
  const slug = slugify(v.slug || v.name);
  if (!slug) return { error: "Please enter a valid slug (letters, numbers and dashes)." };

  const row = {
    name: v.name,
    slug,
    category_id: v.categoryId,
    description: v.description,
    price_inr_paise: v.priceInr === "" ? null : Math.round(v.priceInr * 100),
    style_ref: v.styleRef,
    width_cm: v.width,
    height_cm: v.height,
    depth_cm: v.depth,
    strap_drop_cm: v.strapDrop,
    weight_g: v.weight === null ? null : Math.round(v.weight),
    fits: v.fits,
    leather: v.leather,
    hardware: v.hardware,
    lining: v.lining,
    is_active: v.isActive,
    is_featured: v.isFeatured,
  };

  const supabase = await createClient();
  let productId = v.id;

  if (productId) {
    const { error } = await supabase.from("products").update(row).eq("id", productId);
    if (error) return { error: error.code === "23505" ? "That slug is already used by another product." : error.message };
  } else {
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error) return { error: error.code === "23505" ? "That slug is already used by another product." : error.message };
    productId = data.id;

    // First colour, from the "new product" form.
    const first = variantSchema.safeParse({
      productId,
      colourName: formData.get("colourName"),
      colourHex: formData.get("colourHex"),
      colourFamily: formData.get("colourFamily"),
      sku: formData.get("sku") ?? "",
      stock: formData.get("stock") ?? 0,
      sortOrder: 0,
      isActive: true,
    });
    if (first.success) {
      const f = first.data;
      await supabase.from("product_variants").insert({
        product_id: productId,
        colour_name: f.colourName,
        colour_hex: f.colourHex,
        colour_family: f.colourFamily,
        sku: f.sku,
        stock: f.stock,
        sort_order: 0,
      });
    }
  }

  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    try {
      const variantId = z.uuid().safeParse(formData.get("imageVariantId")).data ?? null;
      await uploadImage(productId, image, String(formData.get("imageAlt") || v.name), variantId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Image upload failed.";
      if (!v.id) redirect(`/admin/products/${productId}/edit?error=${encodeURIComponent(message)}`);
      return { error: message };
    }
  }

  revalidatePath("/", "layout");
  if (!v.id) redirect(`/admin/products/${productId}/edit?saved=1`);
  return { success: "Product saved." };
}

/** Create or update one colour of a product. */
export async function saveVariantAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = variantSchema.safeParse({
    id: formData.get("id") || undefined,
    productId: formData.get("productId"),
    colourName: formData.get("colourName"),
    colourHex: formData.get("colourHex"),
    colourFamily: formData.get("colourFamily"),
    sku: formData.get("sku") ?? "",
    stock: formData.get("stock"),
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the colour." };
  const v = parsed.data;
  const row = {
    colour_name: v.colourName,
    colour_hex: v.colourHex,
    colour_family: v.colourFamily,
    sku: v.sku,
    stock: v.stock,
    sort_order: v.sortOrder,
    is_active: v.isActive,
  };
  const supabase = await createClient();
  const { error } = v.id
    ? await supabase.from("product_variants").update(row).eq("id", v.id)
    : await supabase.from("product_variants").insert({ ...row, product_id: v.productId });
  if (error) {
    return { error: error.code === "23505" ? "This product already has a colour with that name (or SKU)." : error.message };
  }
  revalidatePath("/", "layout");
  return { success: v.id ? "Colour saved." : "Colour added." };
}

export async function deleteVariantAction(formData: FormData) {
  await requireAdmin();
  const { id, productId } = z
    .object({ id: z.uuid(), productId: z.uuid() })
    .parse({ id: formData.get("id"), productId: formData.get("productId") });
  const supabase = await createClient();
  const { count } = await supabase
    .from("product_variants")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  if ((count ?? 0) <= 1) redirect(`/admin/products/${productId}/edit?error=${encodeURIComponent("A bag needs at least one colour.")}`);
  await supabase.from("product_variants").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect(`/admin/products/${productId}/edit?saved=1`);
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();

  // Remove uploaded files from Storage (sample /products/... images are left alone).
  const { data: images } = await supabase.from("product_images").select("url").eq("product_id", id);
  const paths = (images ?? []).map((i) => storagePathFromUrl(i.url)).filter((p): p is string => Boolean(p));
  if (paths.length > 0) await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  redirect("/admin/products?deleted=1");
}

export async function deleteProductImageAction(formData: FormData) {
  await requireAdmin();
  const imageId = z.uuid().parse(formData.get("imageId"));
  const supabase = await createClient();

  const { data: image } = await supabase.from("product_images").select("url, product_id").eq("id", imageId).maybeSingle();
  if (!image) return;

  const path = storagePathFromUrl(image.url);
  if (path) await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
  await supabase.from("product_images").delete().eq("id", imageId);

  revalidatePath(`/admin/products/${image.product_id}/edit`);
}

/**
 * Fulfilment status only. The database refuses shipped/delivered/paid for an
 * online order without a confirmed payment, and admins cannot change amounts.
 */
export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const { id, status } = z
    .object({ id: z.uuid(), status: z.enum(ORDER_STATUSES) })
    .parse({ id: formData.get("id"), status: formData.get("status") });

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  if (error) redirect(`/admin/orders/${id}?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/orders/${id}?updated=1`);
}

/** Cash on Delivery: the courier has collected the money. */
export async function markCodCollectedAction(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const { error } = await createAdminClient().rpc("mark_cod_collected", { p_order_id: id });
  revalidatePath(`/admin/orders/${id}`);
  if (error) redirect(`/admin/orders/${id}?error=${encodeURIComponent(error.message)}`);
  redirect(`/admin/orders/${id}?updated=1`);
}

export async function setReviewStatusAction(formData: FormData) {
  await requireAdmin();
  const { id, status } = z
    .object({ id: z.uuid(), status: z.enum(["published", "hidden"]) })
    .parse({ id: formData.get("id"), status: formData.get("status") });
  const supabase = await createClient();
  await supabase.from("reviews").update({ status }).eq("id", id);
  revalidatePath("/admin/reviews");
  revalidatePath("/", "layout");
}

export async function setMessageHandledAction(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const handled = formData.get("handled") === "true";
  const supabase = await createClient();
  await supabase.from("contact_messages").update({ handled }).eq("id", id);
  revalidatePath("/admin/messages");
}
