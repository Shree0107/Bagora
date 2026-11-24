/** Store-wide settings. Currency/GST live in lib/markets.ts, shipping in lib/shipping.ts. */

export const STORE_NAME = "VÉRANE";
export const STORE_TAGLINE = "Véritablement vôtre";
export const STORE_TAGLINE_EN = "Truly yours";

/** Max quantity of a single colour of a bag per order. */
export const MAX_QTY_PER_ITEM = 10;

/**
 * Discount for paying online (Razorpay) instead of Cash on Delivery.
 * 0.05 = 5% of the subtotal, rounded to the nearest rupee.
 */
export const PREPAID_DISCOUNT_RATE = 0.05;

/** Returns window shown to customers (days after delivery). */
export const RETURN_DAYS = 7;

/** Instagram handle without the @. */
export const INSTAGRAM_HANDLE = "laveraneparis";

/** Name of the Supabase Storage bucket for product images (see 03_storage.sql). */
export const PRODUCT_IMAGES_BUCKET = "product-images";
