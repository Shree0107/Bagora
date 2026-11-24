import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/order/PrintButton";
import { parseShipping } from "@/components/order/OrderSummary";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { invoiceSettings } from "@/lib/env";
import { formatDate, orderNumber } from "@/lib/format";
import { MARKET, formatMoney } from "@/lib/markets";

export const metadata: Metadata = { title: "Tax invoice", robots: { index: false } };

/**
 * Printable GST tax invoice. Hidden (404) until GSTIN, LEGAL_NAME and
 * BUSINESS_ADDRESS are set. Prices are GST-inclusive; the GST portion is shown
 * separately. ⚠️ Confirm the format (HSN code, CGST/SGST vs IGST split) with
 * your accountant before relying on it.
 */
export default async function InvoicePage({ params }: PageProps<"/account/orders/[id]/invoice">) {
  const { id } = await params;
  await requireUser(`/account/orders/${id}/invoice`);
  const seller = invoiceSettings();
  if (!seller) notFound();

  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order || order.currency !== "inr" || order.status === "cancelled" || order.status === "pending") notFound();

  const buyer = parseShipping(order.shipping_address);
  const money = (n: number) => formatMoney(n, "inr");
  const taxable = order.total_cents - order.tax_cents;
  const ratePct = Math.round(MARKET.includedTaxRate * 100);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12 text-[14px] text-espresso print:p-0">
        <div className="no-print mb-8 flex justify-end">
          <PrintButton />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-espresso pb-6">
          <div>
            <p className="sign text-2xl">VÉRANE</p>
            <p className="mt-2">{seller.legalName}</p>
            <p className="max-w-xs whitespace-pre-line text-muted">{seller.address}</p>
            <p className="mt-1">GSTIN: {seller.gstin}</p>
          </div>
          <div className="text-right">
            <h1 className="font-display text-3xl">Tax invoice</h1>
            <p className="mt-2">Invoice no. INV-{order.id.slice(0, 8).toUpperCase()}</p>
            <p>Order {orderNumber(order.id)}</p>
            <p>Date {formatDate(order.paid_at ?? order.created_at)}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="plate-label">Billed &amp; shipped to</p>
          {buyer && (
            <p className="mt-2 leading-relaxed">
              {buyer.name}
              <br />
              {buyer.lines.join(", ")}
              {buyer.phone && (
                <>
                  <br />
                  {buyer.phone}
                </>
              )}
            </p>
          )}
        </div>

        <table className="tabular mt-8 w-full border-collapse">
          <thead>
            <tr className="border-y border-espresso text-left">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Price (incl. GST)</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((i) => (
              <tr key={i.id} className="border-b border-line">
                <td className="py-2">{i.product_name}{i.colour_name ? `, ${i.colour_name}` : ""}</td>
                <td className="py-2 text-right">{i.quantity}</td>
                <td className="py-2 text-right">{money(i.unit_price_cents)}</td>
                <td className="py-2 text-right">{money(i.unit_price_cents * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="tabular mt-6 ml-auto w-full max-w-xs space-y-1.5">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(order.subtotal_cents)}</dd></div>
          {order.discount_cents > 0 && <div className="flex justify-between"><dt>Prepaid discount</dt><dd>− {money(order.discount_cents)}</dd></div>}
          <div className="flex justify-between"><dt>Delivery</dt><dd>{order.shipping_cents ? money(order.shipping_cents) : "Free"}</dd></div>
          <div className="flex justify-between border-t border-line pt-1.5"><dt>Taxable value</dt><dd>{money(taxable)}</dd></div>
          <div className="flex justify-between"><dt>GST @ {ratePct}%</dt><dd>{money(order.tax_cents)}</dd></div>
          <div className="flex justify-between border-t border-espresso pt-1.5 text-base font-medium"><dt>Total</dt><dd>{money(order.total_cents)}</dd></div>
        </dl>

        <p className="mt-10 text-[12px] text-muted">
          Payment: {order.payment_provider === "cod" ? "Cash on delivery" : "Online (Razorpay)"}
          {order.payment_status === "paid" ? ", received." : ", due on delivery."} This is a computer-generated invoice.
        </p>
      </div>
    </div>
  );
}
