import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";

export const metadata: Metadata = { title: "Choose a new password" };

// Reached from the password-reset email (the link logs the user in first).
export default async function ResetPasswordPage() {
  await requireUser("/reset-password");
  const { t } = await getLocale();
  return (
    <AuthCard title={t("auth.newPasswordTitle")}>
      <ResetPasswordForm />
    </AuthCard>
  );
}
