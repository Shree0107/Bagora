import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { CartProvider } from "@/components/cart/CartProvider";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, siteUrl } from "@/lib/env";
import { INSTAGRAM_HANDLE, STORE_NAME, STORE_TAGLINE } from "@/lib/config";
import type { CartLine } from "@/lib/cart/types";

// Jost: a refined geometric sans for the shop-assistant voice. Cormorant Garamond: signage and display.
const jost = Jost({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-jost", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const description =
  "VÉRANE: genuine leather handbags crafted in India. Totes, crossbody, shoulder and work bags from ₹3,490, GST included. Pay online or cash on delivery.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${STORE_NAME} · Genuine leather handbags`, template: `%s · ${STORE_NAME}` },
  description,
  applicationName: STORE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: STORE_NAME,
    locale: "en_IN",
    title: `${STORE_NAME} · ${STORE_TAGLINE}`,
    description,
  },
  twitter: { card: "summary_large_image", title: `${STORE_NAME} · ${STORE_TAGLINE}`, description },
};

export const viewport: Viewport = {
  themeColor: "#1f3a2e",
};

/** The saved cart of the logged-in user (empty for guests). */
async function getSavedCart(userId: string | null): Promise<CartLine[]> {
  if (!userId) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("cart_items").select("product_id, variant_id, quantity").order("created_at");
  return (data ?? []).map((r) => ({ productId: r.product_id, variantId: r.variant_id, quantity: r.quantity }));
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const fontClasses = `${jost.variable} ${cormorant.variable} h-full antialiased`;

  // Friendly message instead of a crash before .env.local is filled in.
  if (!isSupabaseConfigured()) {
    return (
      <html lang="en-IN" className={fontClasses}>
        <body className="flex min-h-full items-center justify-center p-6">
          <div className="max-w-lg text-center">
            <h1 className="text-4xl text-espresso">{STORE_NAME} is almost ready</h1>
            <p className="mt-4 text-muted">
              The Supabase environment variables are missing. Copy <code>.env.example</code> to{" "}
              <code>.env.local</code>, fill in your keys and restart the server. See <code>SETUP.md</code>.
            </p>
          </div>
        </body>
      </html>
    );
  }

  const user = await getCurrentUser();
  const [profile, savedCart] = await Promise.all([getCurrentProfile(), getSavedCart(user?.id ?? null)]);

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: STORE_NAME,
    url: siteUrl(),
    logo: `${siteUrl()}/icon.png`,
    slogan: STORE_TAGLINE,
    sameAs: [`https://instagram.com/${INSTAGRAM_HANDLE}`],
  };

  return (
    <html lang="en-IN" className={fontClasses}>
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }}
        />
        <LocaleProvider>
          {/* key resets the cart state when the user logs in or out */}
          <CartProvider key={user?.id ?? "guest"} userId={user?.id ?? null} initialLines={savedCart}>
            <Header isLoggedIn={Boolean(user)} isAdmin={profile?.role === "admin"} />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
            <WhatsAppButton />
          </CartProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
