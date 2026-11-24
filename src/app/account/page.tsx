import type { Metadata } from "next";
import Link from "next/link";
import { button, container, textLink } from "@/components/ui/styles";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FormMessage } from "@/components/ui/FormMessage";
import { getCurrentProfile, requireUser } from "@/lib/auth";
import { signOutAction } from "@/lib/auth-actions";
import { createClient } from "@/lib/supabase/server";
import { formatDate, orderNumber } from "@/lib/format";
import { formatMoney } from "@/lib/markets";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const user = await requireUser("/account");
  const profile = await getCurrentProfile();
  const { password } = await searchParams;

  // RLS: users can only see their own orders.
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total_cents, currency, payment_provider, created_at, order_items(quantity, product_name, colour_name)")
    .order("created_at", { ascending: false });

  // Abandoned online checkouts stay "pending"/"cancelled"; show only real orders.
  const visible = (orders ?? []).filter((o) => o.status !== "pending" && o.status !== "cancelled");
  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <div className="bg-ivory">
      <div className={`${container} py-12 sm:py-16`}>
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-10">
          <div>
            <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-none text-espresso">
              {firstName ? `Bonjour, ${firstName}` : "Your account"}
            </h1>
            <p className="mt-3 text-[15px] text-muted">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {profile?.role === "admin" && (
              <Link href="/admin" className={`${button.dark} ${button.small}`}>Admin</Link>
            )}
            <Link href="/forgot-password" className={`${button.secondary} ${button.small}`}>Change password</Link>
            <form action={signOutAction}>
              <button type="submit" className={`${button.secondary} ${button.small}`}>Sign out</button>
            </form>
          </div>
        </div>

        {password === "updated" && (
          <div className="mt-8">
            <FormMessage success="Your password has been updated." />
          </div>
        )}

        <section className="mt-12" aria-labelledby="orders-title">
          <h2 id="orders-title" className="font-display text-[32px] text-espresso">Your orders</h2>
          {visible.length === 0 ? (
            <div className="mt-6 border border-line px-6 py-16 text-center">
              <p className="font-display text-2xl text-espresso">No orders yet</p>
              <p className="mt-2 text-muted">When you order, you can follow it here, from confirmation to delivery.</p>
              <Link href="/shop" className={`${button.primary} mt-8`}>Discover the collection</Link>
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {visible.map((o) => {
                const count = o.order_items.reduce((s, i) => s + i.quantity, 0);
                const first = o.order_items[0];
                return (
                  <li key={o.id}>
                    <Link
                      href={`/account/orders/${o.id}`}
                      className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-6 transition-colors hover:bg-ivory-deep/60 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:px-4"
                    >
                      <span>
                        <span className="block font-display text-xl text-espresso">{orderNumber(o.id)}</span>
                        <span className="text-sm text-muted">{formatDate(o.created_at)}</span>
                      </span>
                      <span className="text-right sm:order-last">
                        <StatusBadge status={o.status} />
                      </span>
                      <span className="text-sm text-muted">
                        {first ? `${first.product_name}${first.colour_name ? `, ${first.colour_name}` : ""}` : ""}
                        {count > 1 ? ` + ${count - 1} more` : ""}
                      </span>
                      <span className="tabular text-right text-[15px] text-espresso sm:text-left">
                        {formatMoney(o.total_cents, o.currency)}
                        {o.payment_provider === "cod" && <span className="text-sm text-muted"> · COD</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-8 text-[15px] text-muted">
            Need help with an order?{" "}
            <Link href="/contact" className={textLink}>Contact us</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
