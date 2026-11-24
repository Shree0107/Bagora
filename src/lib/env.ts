/**
 * Central place to read environment variables.
 * Values are read lazily (inside functions) so `npm run build` works even
 * before you have filled in `.env.local`.
 *
 * NEXT_PUBLIC_* variables must be written out literally (process.env.NEXT_PUBLIC_X)
 * so Next.js can inline them into the browser bundle.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in (see SETUP.md).`,
    );
  }
  return value;
}

/** True once the Supabase variables have been filled in. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function supabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabasePublishableKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/** Server only. Bypasses RLS. */
export function supabaseSecretKey(): string {
  return required("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY);
}

/** Server only. Razorpay "Key Id" (rzp_test_… / rzp_live_…). Also sent to the browser to open Checkout — it is not secret. */
export function razorpayKeyId(): string {
  return required("RAZORPAY_KEY_ID", process.env.RAZORPAY_KEY_ID);
}

/** Server only. Razorpay "Key Secret". Used to create orders and verify payment signatures. */
export function razorpayKeySecret(): string {
  return required("RAZORPAY_KEY_SECRET", process.env.RAZORPAY_KEY_SECRET);
}

/** Server only. Secret you set when creating the Razorpay webhook. */
export function razorpayWebhookSecret(): string {
  return required("RAZORPAY_WEBHOOK_SECRET", process.env.RAZORPAY_WEBHOOK_SECRET);
}

/** Is Razorpay configured? (Online payment is unavailable otherwise; COD still works.) */
export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET);
}

/** Optional public settings (features hide themselves when unset). */
export const publicSettings = {
  whatsappNumber: () => (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/[^0-9]/g, ""),
  supportEmail: () => process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
};

/** Invoice details (GST). The invoice page stays hidden until GSTIN + legal name + address are set. */
export function invoiceSettings(): { gstin: string; legalName: string; address: string } | null {
  const gstin = process.env.GSTIN?.trim();
  const legalName = process.env.LEGAL_NAME?.trim();
  const address = process.env.BUSINESS_ADDRESS?.trim();
  return gstin && legalName && address ? { gstin, legalName, address } : null;
}
