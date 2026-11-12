import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, siteUrl } from "@/lib/env";
import { STORE_NAME } from "@/lib/config";
import type { CartLine } from "@/lib/cart/types";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${STORE_NAME} — Leather handbags`, template: `%s · ${STORE_NAME}` },
  description: "Tote, crossbody and shoulder bags in warm, timeless leathers. Free shipping on every order.",
};

export const viewport: Viewport = {
  themeColor: "#faf6f0",
};

/** The saved cart of the logged-in user (empty for guests). */
async function getSavedCart(userId: string | null): Promise<CartLine[]> {
  if (!userId) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("cart_items").select("product_id, quantity").order("created_at");
  return (data ?? []).map((r) => ({ productId: r.product_id, quantity: r.quantity }));
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const fontClasses = `${inter.variable} ${cormorant.variable} h-full antialiased`;

  // Friendly message instead of a crash before .env.local is filled in.
  if (!isSupabaseConfigured()) {
    return (
      <html lang="en" className={fontClasses}>
        <body className="flex min-h-full items-center justify-center p-6">
          <div className="max-w-lg text-center">
            <h1 className="text-4xl text-espresso">{STORE_NAME} is almost ready</h1>
            <p className="mt-4 text-muted">
              The Supabase environment variables are missing. Copy <code>.env.example</code> to{" "}
              <code>.env.local</code>, fill in your keys and restart the server. See <code>SETUP.md</code>, step 7.
            </p>
          </div>
        </body>
      </html>
    );
  }

  const user = await getCurrentUser();
  const [profile, savedCart] = await Promise.all([getCurrentProfile(), getSavedCart(user?.id ?? null)]);

  return (
    <html lang="en" className={fontClasses}>
      <body className="flex min-h-full flex-col">
        {/* key resets the cart state when the user logs in or out */}
        <CartProvider key={user?.id ?? "guest"} userId={user?.id ?? null} initialLines={savedCart}>
          <Header isLoggedIn={Boolean(user)} isAdmin={profile?.role === "admin"} />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
