import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { button, container } from "@/components/ui/styles";
import { OrderSummary } from "@/components/order/OrderSummary";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { invoiceSettings } from "@/lib/env";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default async function AccountOrderPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  await requireUser(`/account/orders/${id}`);

  // RLS returns nothing if this order belongs to someone else.
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order) notFound();

  const { order_items, ...orderRow } = order;
  const invoiceReady = Boolean(invoiceSettings()) && (order.payment_status === "paid" || order.status !== "pending");

  return (
    <div className="bg-ivory">
      <div className={`${container} max-w-3xl py-12 sm:py-16`}>
        <Link href="/account" className="text-sm text-forest underline decoration-gilt underline-offset-4">
          All orders
        </Link>
        <div className="mt-8 bg-ivory-deep p-6 sm:p-10">
          <OrderSummary order={orderRow} items={order_items} />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          {invoiceReady && order.status !== "cancelled" && (
            <Link href={`/account/orders/${order.id}/invoice`} className={button.secondary}>GST invoice</Link>
          )}
          <Link href="/contact" className={button.secondary}>Help with this order</Link>
        </div>
      </div>
    </div>
  );
}
