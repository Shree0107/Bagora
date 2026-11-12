import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { container } from "@/components/ui/styles";
import { OrderSummary } from "@/components/order/OrderSummary";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Order details" };

export default async function AccountOrderPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  await requireUser(`/account/orders/${id}`);

  // RLS returns nothing if this order belongs to someone else.
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order) notFound();

  const { order_items, ...orderRow } = order;
  return (
    <div className={`${container} max-w-3xl py-12 sm:py-16`}>
      <Link href="/account" className="text-sm text-cognac hover:underline">
        ← Back to my account
      </Link>
      <div className="mt-8 rounded-sm bg-ivory/60 p-6 sm:p-10">
        <OrderSummary order={orderRow} items={order_items} />
      </div>
    </div>
  );
}
