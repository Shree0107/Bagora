"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth";
import { siteUrl } from "@/lib/env";
import { getLocale } from "@/lib/locale";

/** Shape returned to forms using useActionState. */
export type FormState = { error?: string; success?: string } | null;

// Messages are i18n keys, translated with the visitor's language.
const email = z.email("auth.err.email");
const password = z.string().min(8, "auth.err.passwordMin");

async function firstError(err: z.ZodError) {
  const { t } = await getLocale();
  return t(err.issues[0]?.message ?? "auth.err.form");
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ email, password: z.string().min(1, "auth.err.passwordRequired") })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: await firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const { t } = await getLocale();
    return { error: t(error.code === "email_not_confirmed" ? "auth.err.confirmFirst" : "auth.err.credentials") };
  }

  revalidatePath("/", "layout");
  redirect(safeNextPath(formData.get("next")));
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      fullName: z.string().trim().min(1, "auth.err.name").max(100),
      email,
      password,
    })
    .safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success) return { error: await firstError(parsed.error) };

  const next = safeNextPath(formData.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    console.error("sign-up failed:", error.code);
    return { error: (await getLocale()).t("auth.err.generic") };
  }

  // If email confirmation is turned off in Supabase, the user is logged in right away.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }
  return { success: (await getLocale()).t("auth.almostThere") };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = email.safeParse(formData.get("email"));
  if (!parsed.success) return { error: await firstError(parsed.error) };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
  });
  // Same message whether or not the account exists (prevents email probing).
  return { success: (await getLocale()).t("auth.resetSent") };
}

export async function updatePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ password, confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: "auth.err.mismatch" })
    .safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: await firstError(parsed.error) };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const { t } = await getLocale();
  if (!data.user) return { error: t("auth.err.expired") };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.code === "same_password" ? t("auth.err.form") : t("auth.err.generic") };

  redirect("/account?password=updated");
}
