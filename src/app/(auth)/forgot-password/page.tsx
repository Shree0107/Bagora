import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";
import { getLocale } from "@/lib/locale";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage() {
  const { t } = await getLocale();
  return (
    <AuthCard
      title={t("auth.forgotTitle")}
      subtitle={t("auth.forgotSub")}
      footer={
        <Link href="/login" className="text-cognac hover:underline">
          {t("auth.backToLogin")}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
