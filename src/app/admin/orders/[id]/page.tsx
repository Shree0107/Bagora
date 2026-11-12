import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { updateOrderStatusAction } from "@/lib/admin-actions";
import { OrderSummary } from "@/components/order/OrderSummary";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { button, input, label } from "@/components/ui/styles";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Order" };

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order) notFound();

  const { order_items, ...orderRow } = order;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
      <div>
        <Link href="/admin/orders" className="text-sm text-cognac hover:underline">
          ← All orders
        </Link>
        <div className="mt-6 rounded-sm bg-ivory/60 p-6 sm:p-8">
          <OrderSummary order={orderRow} items={order_items} />
        </div>
      </div>

      <aside className="space-y-8 lg:pt-11">
        <form action={updateOrderStatusAction} className="space-y-3 rounded-sm border border-sand p-6">
          <input type="hidden" name="id" value={order.id} />
          <label htmlFor="status" className={label}>
            Order status
          </label>
          <select id="status" name="status" defaultValue={order.status} className={input}>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
          <SubmitButton className={`${button.primary} w-full`} pendingText="Updating…">
            Update status
          </SubmitButton>
          <p className="text-xs text-muted">
            Orders become &quot;paid&quot; automatically via Stripe. Changing the status does not refund or charge.
          </p>
        </form>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">Customer</dt>
            <dd className="break-all text-espresso">{order.email}</dd>
          </div>
          {order.paid_at && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Paid</dt>
              <dd>{formatDateTime(order.paid_at)}</dd>
            </div>
          )}
          {order.stripe_payment_intent_id && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Stripe payment</dt>
              <dd className="break-all font-mono text-xs">{order.stripe_payment_intent_id}</dd>
            </div>
          )}
        </dl>
      </aside>
    </div>
  );
}
