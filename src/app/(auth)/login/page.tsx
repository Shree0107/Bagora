import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/AuthForms";
import { getCurrentUser, safeNextPath } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to check out and see your orders."
      footer={
        <>
          New to Bagora?{" "}
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-cognac hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={next} linkError={params.error === "link"} />
    </AuthCard>
  );
}
