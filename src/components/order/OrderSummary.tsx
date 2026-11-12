import Link from "next/link";
import { ProductImage } from "@/components/product/ProductImage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime, formatPrice, orderNumber } from "@/lib/format";
import type { Json, Order, OrderItem } from "@/types/database";

type Address = {
  line1?: string | null;
  line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

/** Reads the { name, address } object Stripe gives us for shipping. */
export function parseShipping(json: Json | null): { name: string | null; lines: string[] } | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const obj = json as { name?: string | null; address?: Address | null };
  const a = obj.address ?? {};
  const lines = [
    a.line1,
    a.line2,
    [a.postal_code, a.city].filter(Boolean).join(" "),
    [a.state, a.country].filter(Boolean).join(", "),
  ].filter((l): l is string => Boolean(l));
  return { name: obj.name ?? null, lines };
}

export function OrderSummary({ order, items }: { order: Order; items: OrderItem[] }) {
  const shipping = parseShipping(order.shipping_address);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Order</p>
          <p className="font-serif text-2xl text-espresso">{orderNumber(order.id)}</p>
          <p className="text-sm text-muted">{formatDateTime(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <ul className="divide-y divide-sand border-y border-sand">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-4">
            <div className="w-16 shrink-0">
              <ProductImage src={item.image_url} alt={item.product_name} sizes="64px" className="rounded-sm" />
            </div>
            <div className="flex-1">
              {item.product_slug ? (
                <Link href={`/products/${item.product_slug}`} className="text-espresso hover:text-cognac">
                  {item.product_name}
                </Link>
              ) : (
                <span>{item.product_name}</span>
              )}
              <p className="text-sm text-muted">
                {item.quantity} × {formatPrice(item.unit_price_cents)}
              </p>
            </div>
            <p className="text-sm tabular-nums">{formatPrice(item.unit_price_cents * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="text-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Shipping to</p>
          {shipping ? (
            <address className="mt-2 not-italic leading-relaxed text-saddle">
              {shipping.name && <span className="block text-espresso">{shipping.name}</span>}
              {shipping.lines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </address>
          ) : (
            <p className="mt-2 text-muted">Available once payment is confirmed.</p>
          )}
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(order.subtotal_cents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd>{order.shipping_cents === 0 ? "Free" : formatPrice(order.shipping_cents)}</dd>
          </div>
          <div className="flex justify-between border-t border-sand pt-2 text-base">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(order.total_cents)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
