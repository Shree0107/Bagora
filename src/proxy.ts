import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// "Proxy" is the Next.js 16 name for what used to be middleware.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Old regional entry URLs (/fr/..., /in/...) from the two-market store.
  const regional = pathname.match(/^\/(fr|in)(\/.*)?$/);
  if (regional) {
    const url = request.nextUrl.clone();
    url.pathname = regional[2] || "/";
    return NextResponse.redirect(url, 308);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    // All pages except static files, images and the payment webhook.
    "/((?!_next/static|_next/image|favicon.ico|api/razorpay/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
