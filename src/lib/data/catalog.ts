import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category, ColourFamily, ProductWithImages, Review, VariantSummary } from "@/types/database";

/** Columns selected for product cards / detail pages. */
const PRODUCT_SELECT =
  "*, product_images(id, url, alt, sort_order, variant_id), product_variants(id, colour_name, colour_hex, colour_family, stock, sort_order, is_active), categories(name, slug)" as const;

export type SortOption = "featured" | "newest" | "price_asc" | "price_desc";

/** Price bands shown in the filter (₹, GST incl.). */
export const PRICE_BANDS = [
  { id: "under-4000", label: "Under ₹4,000", min: 0, max: 399999 },
  { id: "4000-5000", label: "₹4,000 – ₹5,000", min: 400000, max: 500000 },
  { id: "over-5000", label: "Over ₹5,000", min: 500001, max: null },
] as const;
export type PriceBand = (typeof PRICE_BANDS)[number]["id"];

export const COLOUR_FAMILIES: { id: ColourFamily; label: string; hex: string }[] = [
  { id: "black", label: "Black", hex: "#1D1A18" },
  { id: "brown", label: "Brown", hex: "#5A3A28" },
  { id: "tan", label: "Tan & Cognac", hex: "#8A4A22" },
  { id: "burgundy", label: "Burgundy", hex: "#5E1F24" },
  { id: "green", label: "Green", hex: "#1F3A2E" },
  { id: "cream", label: "Cream", hex: "#E9DFCF" },
  { id: "grey", label: "Grey", hex: "#8B8580" },
  { id: "blue", label: "Blue", hex: "#5B6F8C" },
  { id: "pink", label: "Pink", hex: "#D9A9A6" },
  { id: "other", label: "Other", hex: "#B9A894" },
];

export type ProductFilters = {
  categorySlug?: string;
  sort?: SortOption;
  colours?: ColourFamily[];
  price?: PriceBand;
  inStockOnly?: boolean;
};

const one = (params: Record<string, string | string[] | undefined>, k: string) => {
  const v = params[k];
  return Array.isArray(v) ? v[0] : v;
};

export function parseFilters(params: Record<string, string | string[] | undefined>): ProductFilters {
  const sort = one(params, "sort");
  const families = new Set<string>(COLOUR_FAMILIES.map((c) => c.id));
  const colours = (one(params, "colour") ?? "")
    .split(",")
    .filter((c): c is ColourFamily => families.has(c));
  const price = one(params, "price");
  return {
    sort: sort === "price_asc" || sort === "price_desc" || sort === "newest" ? sort : "featured",
    colours: colours.length ? colours : undefined,
    price: PRICE_BANDS.some((b) => b.id === price) ? (price as PriceBand) : undefined,
    inStockOnly: one(params, "stock") === "1",
  };
}

/** Sort images and keep only active variants (in display order). */
function normalise(p: ProductWithImages): ProductWithImages {
  return {
    ...p,
    product_images: [...p.product_images].sort((a, b) => a.sort_order - b.sort_order),
    product_variants: [...(p.product_variants ?? [])]
      .filter((v) => v.is_active)
      .sort((a, b) => a.sort_order - b.sort_order),
  };
}

// Single-language store: kept as helpers so call sites read clearly.
export const productName = (p: { name: string }) => p.name;
export const productDescription = (p: { description: string }) => p.description;
export const categoryName = (c: { name: string }) => c.name;

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return data;
});

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

/** Active, priced products with optional filters and sorting. */
export async function getProducts(filters: ProductFilters = {}): Promise<ProductWithImages[]> {
  const supabase = await createClient();

  let categoryId: string | undefined;
  if (filters.categorySlug) {
    const category = await getCategoryBySlug(filters.categorySlug);
    if (!category) return [];
    categoryId = category.id;
  }

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .not("price_inr_paise", "is", null);
  if (categoryId) query = query.eq("category_id", categoryId);
  const band = PRICE_BANDS.find((b) => b.id === filters.price);
  if (band) {
    query = query.gte("price_inr_paise", band.min);
    if (band.max !== null) query = query.lte("price_inr_paise", band.max);
  }
  if (filters.inStockOnly) query = query.gt("stock", 0);

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price_inr_paise", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_inr_paise", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load products: ${error.message}`);
  let products = (data as ProductWithImages[]).map(normalise);
  // Colour is matched on the variants (filtered here so every swatch stays visible on the card).
  if (filters.colours?.length) {
    const wanted = new Set(filters.colours);
    products = products.filter((p) => p.product_variants.some((v) => wanted.has(v.colour_family)));
  }
  return products;
}

/** Colour families that actually exist in the catalogue (for the filter). */
export async function getAvailableColours(): Promise<typeof COLOUR_FAMILIES> {
  const supabase = await createClient();
  const { data } = await supabase.from("product_variants").select("colour_family").eq("is_active", true);
  const present = new Set((data ?? []).map((v) => v.colour_family));
  return COLOUR_FAMILIES.filter((c) => present.has(c.id));
}

export async function getFeaturedProducts(limit = 4): Promise<ProductWithImages[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .eq("is_featured", true)
    .not("price_inr_paise", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load featured products: ${error.message}`);
  return (data as ProductWithImages[]).map(normalise);
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductWithImages | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data ? normalise(data as ProductWithImages) : null;
});

/** "Complete the look": products from other categories. */
export async function getCompleteTheLook(product: ProductWithImages, limit = 3): Promise<ProductWithImages[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .neq("category_id", product.category_id)
    .not("price_inr_paise", "is", null)
    .order("is_featured", { ascending: false })
    .limit(limit);
  return ((data ?? []) as ProductWithImages[]).map(normalise);
}

/** Published reviews for a product (newest first) plus the average. */
export async function getReviews(productId: string): Promise<{ reviews: Review[]; average: number | null }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);
  const reviews = data ?? [];
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  return { reviews, average };
}

/** Images for one colour: its own photos first, then the shared ones. */
export function imagesForVariant(p: ProductWithImages, variantId: string | null) {
  const own = p.product_images.filter((i) => variantId && i.variant_id === variantId);
  const shared = p.product_images.filter((i) => i.variant_id === null);
  const list = own.length ? [...own, ...shared] : shared.length ? shared : p.product_images;
  return list;
}

/** The variant chosen in the URL (?colour=<name>), else the first in stock, else the first. */
export function pickVariant(p: ProductWithImages, colour?: string | null): VariantSummary | null {
  const vs = p.product_variants;
  if (!vs.length) return null;
  const byName = colour ? vs.find((v) => slugColour(v.colour_name) === colour) : undefined;
  return byName ?? vs.find((v) => v.stock > 0) ?? vs[0];
}

/** "Crème" -> "creme" (for ?colour= URLs). */
export function slugColour(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** First image URL of a product, or null. */
export function primaryImage(p: Pick<ProductWithImages, "product_images">): string | null {
  return p.product_images[0]?.url ?? null;
}

/** Every active product slug (sitemap). */
export async function getAllProductSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("slug, updated_at").eq("is_active", true);
  return data ?? [];
}
