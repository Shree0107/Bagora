import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Category, ProductWithImages } from "@/types/database";

/** Columns selected for product cards / detail pages. */
const PRODUCT_SELECT =
  "*, product_images(id, url, alt, sort_order), categories(name, slug)" as const;

export type SortOption = "newest" | "price_asc" | "price_desc";

export type ProductFilters = {
  categorySlug?: string;
  sort?: SortOption;
  minPrice?: number; // euros
  maxPrice?: number; // euros
  inStockOnly?: boolean;
};

export function parseFilters(params: Record<string, string | string[] | undefined>): ProductFilters {
  const one = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const num = (k: string) => {
    const n = Number(one(k));
    return Number.isFinite(n) && n >= 0 && one(k) !== "" && one(k) !== undefined ? n : undefined;
  };
  const sort = one("sort");
  return {
    sort: sort === "price_asc" || sort === "price_desc" ? sort : "newest",
    minPrice: num("min"),
    maxPrice: num("max"),
    inStockOnly: one("stock") === "1",
  };
}

function sortImages(p: ProductWithImages): ProductWithImages {
  return { ...p, product_images: [...p.product_images].sort((a, b) => a.sort_order - b.sort_order) };
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return data;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
  return data;
}

/** Active products, with optional category/price/stock filters and sorting. */
export async function getProducts(filters: ProductFilters = {}): Promise<ProductWithImages[]> {
  const supabase = await createClient();

  let categoryId: string | undefined;
  if (filters.categorySlug) {
    const category = await getCategoryBySlug(filters.categorySlug);
    if (!category) return [];
    categoryId = category.id;
  }

  let query = supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (filters.minPrice !== undefined) query = query.gte("price_cents", Math.round(filters.minPrice * 100));
  if (filters.maxPrice !== undefined) query = query.lte("price_cents", Math.round(filters.maxPrice * 100));
  if (filters.inStockOnly) query = query.gt("stock", 0);

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_cents", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load products: ${error.message}`);
  return (data as ProductWithImages[]).map(sortImages);
}

export async function getFeaturedProducts(limit = 3): Promise<ProductWithImages[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load featured products: ${error.message}`);
  return (data as ProductWithImages[]).map(sortImages);
}

export async function getProductBySlug(slug: string): Promise<ProductWithImages | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data ? sortImages(data as ProductWithImages) : null;
}

/** Products for the cart page (by id). Inactive/deleted ones are simply missing. */
export async function getProductsByIds(ids: string[]): Promise<ProductWithImages[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", ids)
    .eq("is_active", true);
  if (error) throw new Error(`Could not load cart products: ${error.message}`);
  return (data as ProductWithImages[]).map(sortImages);
}

/** First image URL of a product, or a neutral placeholder. */
export function primaryImage(p: Pick<ProductWithImages, "product_images">): string | null {
  return p.product_images[0]?.url ?? null;
}
