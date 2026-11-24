"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import type { OrderStatus } from "@/types/database";

/**
 * Storefront form actions: newsletter, contact, reviews, order tracking.
 * Each one is validated and rate-limited on the server. Logs never contain
 * personal data.
 */

export type FormState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> };

async function clientKey(prefix: string) {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local").split(",")[0].trim();
  return `${prefix}:${ip}`;
}

const email = z.email("Please enter a valid email address.").max(254).transform((v) => v.trim().toLowerCase());

/* ------------------------------------------------------------------ newsletter */

export async function subscribeNewsletterAction(_: FormState, form: FormData): Promise<FormState> {
  if (form.get("company")) return { ok: true, message: "Thank you, you're on the list." }; // honeypot
  const parsed = z
    .object({ email, source: z.enum(["footer", "home"]).catch("footer") })
    .safeParse({ email: form.get("email"), source: form.get("source") });
  if (!parsed.success) return { error: "Please enter a valid email address." };
  if (!(await rateLimit(await clientKey("newsletter"), 5, 600))) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }
  const { error } = await createAdminClient().from("newsletter_subscribers").insert(parsed.data);
  if (error && error.code !== "23505") {
    console.error("newsletter insert failed:", error.code);
    return { error: "Something went wrong. Please try again." };
  }
  return { ok: true, message: "Thank you, you're on the list. We write rarely, and only when it matters." };
}

/* --------------------------------------------------------------------- contact */

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please tell us your name.").max(80),
  email,
  phone: z.string().trim().max(20).optional().transform((v) => v || null),
  orderRef: z.string().trim().max(40).optional().transform((v) => v || null),
  message: z.string().trim().min(5, "Please write a short message.").max(4000),
});

export async function sendContactMessageAction(_: FormState, form: FormData): Promise<FormState> {
  if (form.get("company")) return { ok: true, message: "Thank you. We'll reply soon." };
  const parsed = contactSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Please check the highlighted fields.", fieldErrors };
  }
  if (!(await rateLimit(await clientKey("contact"), 5, 3600))) {
    return { error: "Too many messages. Please try again later, or write to us on WhatsApp." };
  }
  const d = parsed.data;
  const { error } = await createAdminClient()
    .from("contact_messages")
    .insert({ name: d.name, email: d.email, phone: d.phone, order_ref: d.orderRef, message: d.message });
  if (error) {
    console.error("contact insert failed:", error.code);
    return { error: "Your message could not be sent. Please try again." };
  }
  return { ok: true, message: "Thank you. Your message has reached us; we reply within one working day." };
}

/* --------------------------------------------------------------------- reviews */

const reviewSchema = z.object({
  productId: z.uuid(),
  slug: z.string().max(120),
  rating: z.coerce.number().int().min(1, "Please choose a rating.").max(5),
  title: z.string().trim().max(120).default(""),
  body: z.string().trim().min(10, "Please write at least a sentence (10 characters).").max(2000),
  authorName: z.string().trim().min(1, "Please add the name to show.").max(60),
});

export async function submitReviewAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = reviewSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Please check your review.", fieldErrors };
  }
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Please sign in to write a review." };
  if (!(await rateLimit(`review:${auth.user.id}`, 5, 3600))) return { error: "Please try again later." };

  const d = parsed.data;
  // RLS only accepts reviews from customers who bought this bag.
  const { error } = await supabase.from("reviews").upsert(
    {
      product_id: d.productId,
      user_id: auth.user.id,
      author_name: d.authorName,
      rating: d.rating,
      title: d.title,
      body: d.body,
      status: "published",
    },
    { onConflict: "product_id,user_id" },
  );
  if (error) {
    return {
      error:
        error.code === "42501"
          ? "Reviews are open to customers who have received this bag."
          : "Your review could not be saved. Please try again.",
    };
  }
  revalidatePath(`/products/${d.slug}`);
  return { ok: true, message: "Thank you, your review is published." };
}

/* ---------------------------------------------------------------- track order */

export type TrackResult = FormState & {
  order?: {
    number: string;
    status: OrderStatus;
    paymentProvider: string | null;
    paymentStatus: string;
    createdAt: string;
    paidAt: string | null;
    items: { name: string; colour: string | null; quantity: number }[];
  };
};

export async function trackOrderAction(_: TrackResult, form: FormData): Promise<TrackResult> {
  const parsed = z
    .object({
      orderNumber: z
        .string()
        .trim()
        .transform((v) => v.replace(/^#/, "").toLowerCase())
        .pipe(z.string().regex(/^[0-9a-f]{8}$/, "Order numbers look like #3F2A9C1B.")),
      email,
    })
    .safeParse({ orderNumber: form.get("orderNumber"), email: form.get("email") });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Please check the order number and email.", fieldErrors };
  }
  if (!(await rateLimit(await clientKey("track"), 10, 600))) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const { orderNumber, email: mail } = parsed.data;
  // Match the 8-character prefix of the order id + the email used at checkout.
  const lower = `${orderNumber}-0000-0000-0000-000000000000`;
  const upper = `${orderNumber}-ffff-ffff-ffff-ffffffffffff`;
  const { data } = await createAdminClient()
    .from("orders")
    .select("id, status, payment_provider, payment_status, created_at, paid_at, email, order_items(product_name, colour_name, quantity)")
    .gte("id", lower)
    .lte("id", upper)
    .ilike("email", mail)
    .limit(1)
    .maybeSingle();

  if (!data) return { error: "We couldn't find an order with that number and email." };
  return {
    ok: true,
    order: {
      number: `#${data.id.slice(0, 8).toUpperCase()}`,
      status: data.status,
      paymentProvider: data.payment_provider,
      paymentStatus: data.payment_status,
      createdAt: data.created_at,
      paidAt: data.paid_at,
      items: data.order_items.map((i) => ({ name: i.product_name, colour: i.colour_name, quantity: i.quantity })),
    },
  };
}
