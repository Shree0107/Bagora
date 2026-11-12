import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/** The verified current user (or null). Cached for the duration of one request. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

/** The current user's profile row (or null when logged out). */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data;
});

/** Use at the top of pages / actions that need a logged-in user. */
export async function requireUser(next = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/**
 * Use at the top of every admin page AND admin Server Action.
 * Non-admins get a 404 so the admin area isn't advertised.
 */
export async function requireAdmin() {
  const user = await requireUser("/admin");
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") notFound();
  return { user, profile };
}

/** Only allow redirects to paths on this site (prevents open redirects). */
export function safeNextPath(next: unknown, fallback = "/account"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }
  return next;
}
