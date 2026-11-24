/**
 * VÉRANE sells in India only: INR, English, Razorpay + Cash on Delivery.
 * Safe to import on server AND client.
 *
 * Prices are stored in products.price_inr_paise (INR paise, GST included).
 * All amounts are integers in paise (₹1 = 100 paise).
 *
 * The `market` / `lang` names are kept so older call sites stay simple; there
 * is exactly one of each.
 */

export type Market = "in";
export type Lang = "en";
export type Currency = "inr";

export const MARKET = {
  code: "in" as Market,
  country: "IN" as const,
  name: "India",
  currency: "inr" as Currency,
  /**
   * GST already INCLUDED in prices (used to record the tax portion on each
   * order). ⚠️ Confirm the rate for your products (HSN code) with your
   * accountant before going live.
   */
  includedTaxRate: 0.18,
};

export const DEFAULT_MARKET: Market = "in";

/** Price of a product (paise, GST incl.), or null if it isn't for sale. */
export function priceFor(product: { price_inr_paise: number | null }): number | null {
  return product.price_inr_paise;
}

/** GST included in a GST-inclusive total, rounded to the paisa. */
export function includedTax(total: number): number {
  return Math.round(total - total / (1 + MARKET.includedTaxRate));
}

export const PROVIDER_NAME = { razorpay: "Razorpay", cod: "Cash on Delivery", stripe: "Stripe" } as const;

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const inrWhole = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const eur = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

/** 459000 -> "₹4,590" · 459050 -> "₹4,590.50". Old EUR orders still format in €. */
export function formatMoney(minor: number, currency: string = "inr"): string {
  if (currency.toLowerCase() === "eur") return eur.format(minor / 100);
  return (minor % 100 === 0 ? inrWhole : inr).format(minor / 100);
}
