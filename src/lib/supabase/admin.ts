import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { supabaseSecretKey, supabaseUrl } from "@/lib/env";

/**
 * Supabase client with the SECRET key. It BYPASSES Row Level Security.
 * Use only on the server, only for trusted work: creating orders at checkout
 * and processing Stripe webhooks. Never import this from a Client Component.
 */
export function createAdminClient() {
  return createClient<Database>(supabaseUrl(), supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
