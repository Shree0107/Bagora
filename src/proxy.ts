import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// "Proxy" is the Next.js 16 name for what used to be middleware.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Run on all pages except static files, images and the Stripe webhook.
    "/((?!_next/static|_next/image|favicon.ico|products/|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
