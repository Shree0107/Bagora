import type { Metadata } from "next";
import Link from "next/link";
import { button, container, eyebrow } from "@/components/ui/styles";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FormMessage } from "@/components/ui/FormMessage";
import { getCurrentProfile, requireUser } from "@/lib/auth";
import { signOutAction } from "@/lib/auth-actions";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice, orderNumber } from "@/lib/format";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const user = await requireUser("/account");
  const profile = await getCurrentProfile();
  const { password } = await searchParams;

  // RLS: users can only see their own orders.
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total_cents, created_at, order_items(quantity)")
    .order("created_at", { ascending: false });

  // Abandoned checkouts stay "pending"/"cancelled"; only show real orders by default.
  const visible = (orders ?? []).filter((o) => o.status !== "pending" && o.status !== "cancelled");

  return (
    <div className={`${container} py-12 sm:py-16`}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className={eyebrow}>My account</p>
          <h1 className="mt-3 text-4xl text-espresso sm:text-5xl">
            Hello{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-2 text-sm text-muted">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {profile?.role === "admin" && (
            <Link href="/admin" className={`${button.dark} ${button.small}`}>
              Admin dashboard
            </Link>
          )}
          <Link href="/forgot-password" className={`${button.secondary} ${button.small}`}>
            Change password
          </Link>
          <form action={signOutAction}>
            <button type="submit" className={`${button.secondary} ${button.small}`}>
              Log out
            </button>
          </form>
        </div>
      </div>

      {password === "updated" && (
        <div className="mt-8">
          <FormMessage success="Your password has been updated." />
        </div>
      )}

      <section className="mt-14">
        <h2 className="text-3xl text-espresso">Order history</h2>
        {visible.length === 0 ? (
          <div className="mt-6 rounded-sm border border-dashed border-sand py-14 text-center">
            <p className="text-muted">You haven&apos;t placed any orders yet.</p>
            <Link href="/shop" className={`${button.primary} mt-6`}>
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-sand border-y border-sand">
            {visible.map((o) => {
              const count = o.order_items.reduce((s, i) => s + i.quantity, 0);
              return (
                <li key={o.id}>
                  <Link
                    href={`/account/orders/${o.id}`}
                    className="grid grid-cols-2 items-center gap-3 py-5 hover:bg-ivory/50 sm:grid-cols-4 sm:px-3"
                  >
                    <span className="font-serif text-lg text-espresso">{orderNumber(o.id)}</span>
                    <span className="text-right text-sm text-muted sm:text-left">{formatDate(o.created_at)}</span>
                    <span className="text-sm text-muted">
                      {count} item{count === 1 ? "" : "s"} · {formatPrice(o.total_cents)}
                    </span>
                    <span className="text-right">
                      <StatusBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
