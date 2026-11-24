import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, orderNumber } from "@/lib/format";
import { PROVIDER_NAME, formatMoney } from "@/lib/markets";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { OrderStatus } from "@/types/database";

export const metadata: Metadata = { title: "Orders" };

const FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid · to ship" },
  { value: "confirmed", label: "COD · to ship" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "pending", label: "Awaiting payment" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const { status } = await searchParams;
  const active = FILTERS.find((f) => f.value === status)?.value ?? "all";
  const href = (s: string) => (s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`);

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, email, status, payment_status, payment_provider, currency, total_cents, created_at, order_items(quantity)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (active !== "all") query = query.eq("status", active);
  const { data: orders } = await query;

  return (
    <div>
      <h1 className="font-display text-4xl text-espresso">Orders</h1>

      <nav aria-label="Filter orders" className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={href(f.value)}
            className={`shrink-0 border px-4 py-2 text-sm ${
              f.value === active ? "border-forest bg-forest text-ivory" : "border-line text-espresso hover:border-forest"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="py-3 pr-4 font-medium">Order</th>
              <th className="py-3 pr-4 font-medium">Date</th>
              <th className="py-3 pr-4 font-medium">Customer</th>
              <th className="py-3 pr-4 font-medium">Items</th>
              <th className="py-3 pr-4 font-medium">Total</th>
              <th className="py-3 pr-4 font-medium">Payment</th>
              <th className="py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="hover:bg-ivory-deep/50">
                <td className="py-3 pr-4">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-forest underline decoration-gilt underline-offset-4">
                    {orderNumber(o.id)}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-muted">{formatDateTime(o.created_at)}</td>
                <td className="py-3 pr-4 text-espresso">{o.email}</td>
                <td className="tabular py-3 pr-4">{o.order_items.reduce((s, i) => s + i.quantity, 0)}</td>
                <td className="tabular py-3 pr-4">{formatMoney(o.total_cents, o.currency)}</td>
                <td className="py-3 pr-4 text-muted">
                  {o.payment_provider ? PROVIDER_NAME[o.payment_provider] : "—"} · {o.payment_status}
                </td>
                <td className="py-3">
                  <StatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders?.length === 0 && <p className="py-10 text-center text-muted">No orders here yet.</p>}
      </div>
    </div>
  );
}
