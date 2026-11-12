"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/config";
import { slugify } from "@/lib/format";
import type { FormState } from "@/lib/auth-actions";
import type { OrderStatus } from "@/types/database";

/**
 * Admin-only Server Actions. Each one calls requireAdmin() first, and the
 * database RLS policies enforce the same rule a second time.
 */

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // keep in sync with next.config bodySizeLimit
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const productSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Name is required.").max(120),
  slug: z.string().trim().max(120).optional(),
  categoryId: z.uuid("Please choose a category."),
  description: z.string().trim().max(5000),
  price: z.coerce.number().min(0.5, "Price must be at least €0.50.").max(100000),
  stock: z.coerce.number().int("Stock must be a whole number.").min(0).max(100000),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

/** Extract the storage path from a public Storage URL (null for /products/... sample images). */
function storagePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

async function uploadImage(productId: string, file: File, alt: string) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Image must be JPG, PNG, WebP or AVIF.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be smaller than 4 MB.");

  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${productId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, url: data.publicUrl, alt, sort_order: count ?? 0 });
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
    price: formData.get("price"),
    stock: formData.get("stock"),
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
    price_cents: Math.round(v.price * 100),
    stock: v.stock,
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
  }

  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    try {
      await uploadImage(productId, image, v.name);
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

  const { data: image } = await supabase
    .from("product_images")
    .select("url, product_id")
    .eq("id", imageId)
    .maybeSingle();
  if (!image) return;

  const path = storagePathFromUrl(image.url);
  if (path) await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
  await supabase.from("product_images").delete().eq("id", imageId);

  revalidatePath(`/admin/products/${image.product_id}/edit`);
}

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const satisfies readonly OrderStatus[];

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const { id, status } = z
    .object({ id: z.uuid(), status: z.enum(STATUSES) })
    .parse({ id: formData.get("id"), status: formData.get("status") });

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}
