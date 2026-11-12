/** Store-wide settings. Change them here in one place. */

export const STORE_NAME = "Bagora";
export const CURRENCY = "eur";
export const LOCALE = "en-IE"; // formats euros as "€189.00"

/** Max quantity of a single product per order. */
export const MAX_QTY_PER_ITEM = 10;

/** Countries Stripe Checkout accepts shipping addresses for (free shipping). */
export const SHIPPING_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES",
  "SE", "GB", "US",
] as const;

/** Name of the Supabase Storage bucket for product images (see 03_storage.sql). */
export const PRODUCT_IMAGES_BUCKET = "product-images";
