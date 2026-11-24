import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/AuthForms";
import { getCurrentUser, safeNextPath } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { STORE_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  if (await getCurrentUser()) redirect(next);
  const { t } = await getLocale();

  return (
    <AuthCard
      title={t("auth.welcomeBack")}
      subtitle={t("auth.loginSub")}
      footer={
        <>
          {t("auth.newTo", { store: STORE_NAME })}{" "}
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-cognac hover:underline">
            {t("auth.createAccount")}
          </Link>
        </>
      }
    >
      <LoginForm next={next} linkError={params.error === "link"} />
    </AuthCard>
  );
}
