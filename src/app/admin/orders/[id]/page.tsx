import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { markCodCollectedAction, updateOrderStatusAction } from "@/lib/admin-actions";
import { OrderSummary } from "@/components/order/OrderSummary";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { button, input, label } from "@/components/ui/styles";
import { formatDateTime } from "@/lib/format";
import { ORDER_STATUSES, STATUS_LABEL } from "@/lib/orders";
import { PROVIDER_NAME } from "@/lib/markets";
import { FormMessage } from "@/components/ui/FormMessage";

export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderPage({ params, searchParams }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { error, updated } = await searchParams;

  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order) notFound();

  const { order_items, ...orderRow } = order;
  const cod = order.payment_provider === "cod";
  const row = (dt: string, dd: React.ReactNode) => (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted">{dt}</dt>
      <dd className="break-all text-espresso">{dd}</dd>
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div>
        <Link href="/admin/orders" className="text-sm text-forest underline decoration-gilt underline-offset-4">
          All orders
        </Link>
        <div className="mt-6 bg-ivory-deep p-6 sm:p-8">
          <OrderSummary order={orderRow} items={order_items} />
        </div>
      </div>

      <aside className="space-y-8 lg:pt-11">
        {typeof error === "string" && <FormMessage error={`Not changed: ${error}`} />}
        {updated && !error && <FormMessage success="Order updated." />}
        <form action={updateOrderStatusAction} className="space-y-3 border border-line p-6">
          <input type="hidden" name="id" value={order.id} />
          <label htmlFor="status" className={label}>Order status</label>
          <select id="status" name="status" defaultValue={order.status} className={input}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <SubmitButton className={`${button.primary} w-full`} pendingText="Updating…">
            Update status
          </SubmitButton>
          <p className="text-xs text-muted">
            Online payments are confirmed automatically by Razorpay; those orders need a confirmed payment before shipping.
            COD orders are confirmed at checkout and can ship right away. Changing the status never refunds or charges.
          </p>
        </form>

        {cod && order.payment_status !== "paid" && (
          <form action={markCodCollectedAction} className="space-y-3 border border-line p-6">
            <input type="hidden" name="id" value={order.id} />
            <p className="text-sm text-espresso">Cash on delivery: mark as paid once the courier has collected the money (after shipping).</p>
            <SubmitButton className={`${button.secondary} w-full`} pendingText="Saving…">
              Mark cash collected
            </SubmitButton>
          </form>
        )}

        <dl className="space-y-3 text-sm">
          {row(
            "Payment",
            <>
              {order.payment_provider ? PROVIDER_NAME[order.payment_provider] : "—"} · {order.payment_status}
              {order.payment_method && <> · {order.payment_method}</>}
            </>,
          )}
          {order.shipping_method && row("Shipping method", order.shipping_method)}
          {row("Customer", order.email)}
          {order.paid_at && row("Paid", formatDateTime(order.paid_at))}
          {order.razorpay_payment_id && row("Razorpay payment", <span className="font-mono text-xs">{order.razorpay_payment_id}</span>)}
          {order.stripe_payment_intent_id && row("Stripe payment (old order)", <span className="font-mono text-xs">{order.stripe_payment_intent_id}</span>)}
        </dl>
      </aside>
    </div>
  );
}
