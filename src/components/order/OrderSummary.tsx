import Link from "next/link";
import { ProductImage } from "@/components/product/ProductImage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OrderTimeline } from "./OrderTimeline";
import { formatDateTime, orderNumber } from "@/lib/format";
import { PROVIDER_NAME, formatMoney } from "@/lib/markets";
import type { Json, Order, OrderItem } from "@/types/database";

type Address = {
  line1?: string | null;
  line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

/** Reads the { name, phone, address } object stored on the order. */
export function parseShipping(json: Json | null): { name: string | null; phone: string | null; lines: string[] } | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const obj = json as { name?: string | null; phone?: string | null; address?: Address | null };
  const a = obj.address ?? {};
  const lines = [
    a.line1,
    a.line2,
    [a.city, a.postal_code].filter(Boolean).join(" "),
    [a.state, a.country === "IN" ? "India" : a.country].filter(Boolean).join(", "),
  ].filter((l): l is string => Boolean(l));
  return { name: obj.name ?? null, phone: obj.phone ?? null, lines };
}

/** Order details. Amounts are formatted in the order's own currency (old orders may be in €). */
export function OrderSummary({ order, items }: Readonly<{ order: Order; items: OrderItem[] }>) {
  const money = (minor: number) => formatMoney(minor, order.currency);
  const shipping = parseShipping(order.shipping_address);
  const provider = order.payment_provider ? PROVIDER_NAME[order.payment_provider] : null;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-[28px] leading-none text-espresso">Order {orderNumber(order.id)}</p>
          <p className="mt-2 text-sm text-muted">{formatDateTime(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <OrderTimeline order={order} />

      <ul className="divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-4">
            <div className="w-16 shrink-0">
              <ProductImage src={item.image_url} alt={item.product_name} sizes="64px" zoom={false} />
            </div>
            <div className="flex-1 text-[15px]">
              {item.product_slug ? (
                <Link href={`/products/${item.product_slug}`} className="text-espresso hover:text-forest">
                  {item.product_name}
                </Link>
              ) : (
                <span>{item.product_name}</span>
              )}
              <p className="text-sm text-muted">
                {[item.colour_name, `Qty ${item.quantity}`, money(item.unit_price_cents)].filter(Boolean).join(" · ")}
              </p>
            </div>
            <p className="tabular text-[15px]">{money(item.unit_price_cents * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-10 sm:grid-cols-2">
        <div className="text-[15px]">
          <p className="plate-label text-espresso">Delivering to</p>
          {shipping ? (
            <address className="mt-3 not-italic leading-relaxed text-muted">
              {shipping.name && <span className="block text-espresso">{shipping.name}</span>}
              {shipping.lines.map((l) => (
                <span key={l} className="block">{l}</span>
              ))}
              {shipping.phone && <span className="mt-1 block">{shipping.phone}</span>}
            </address>
          ) : (
            <p className="mt-3 text-muted">Address not available.</p>
          )}
          {provider && (
            <>
              <p className="plate-label mt-6 text-espresso">Payment</p>
              <p className="mt-3 text-muted">
                {provider}
                {order.payment_method && order.payment_method !== "cod" ? ` · ${order.payment_method.toUpperCase()}` : ""}
                {order.payment_provider === "cod" && order.payment_status !== "paid" ? " · pay when it arrives" : ""}
              </p>
            </>
          )}
        </div>
        <dl className="tabular space-y-2 text-[15px]">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(order.subtotal_cents)}</dd></div>
          {order.discount_cents > 0 && (
            <div className="flex justify-between text-forest"><dt>Online payment discount</dt><dd>− {money(order.discount_cents)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.shipping_cents === 0 ? "Free" : money(order.shipping_cents)}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 text-lg"><dt>Total</dt><dd>{money(order.total_cents)}</dd></div>
          {order.tax_cents > 0 && (
            <p className="text-[13px] text-muted">Includes {order.currency === "inr" ? "GST" : "VAT"} of {money(order.tax_cents)}.</p>
          )}
        </dl>
      </div>
    </div>
  );
}
