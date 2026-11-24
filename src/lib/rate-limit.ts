import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Fixed-window rate limit stored in Postgres (works across serverless
 * instances). Returns true when the request is allowed.
 * If the limiter itself fails we allow the request (and log), so a database
 * hiccup never blocks a paying customer.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("rate limiter unavailable:", error.message);
    return true;
  }
  return data === true;
}
