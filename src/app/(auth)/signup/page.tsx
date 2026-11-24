import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/AuthForms";
import { getCurrentUser, safeNextPath } from "@/lib/auth";
import { getLocale } from "@/lib/locale";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const next = safeNextPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  const { t } = await getLocale();

  return (
    <AuthCard
      title={t("auth.createTitle")}
      subtitle={t("auth.createSub")}
      footer={
        <>
          {t("auth.haveAccount")}{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-cognac hover:underline">
            {t("auth.login")}
          </Link>
        </>
      }
    >
      <SignupForm next={next} />
    </AuthCard>
  );
}
