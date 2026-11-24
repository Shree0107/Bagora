"use client";

import { useActionState } from "react";
import { trackOrderAction, type TrackResult } from "@/lib/site-actions";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { button, input, label } from "@/components/ui/styles";

export function TrackOrderForm() {
  const [state, action, pending] = useActionState<TrackResult, FormData>(trackOrderAction, {});
  const err = state.fieldErrors ?? {};
  const o = state.order;

  return (
    <div className="not-prose space-y-10">
      <form action={action} noValidate className="grid gap-5 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
        <div>
          <label htmlFor="t-num" className={label}>Order number</label>
          <input id="t-num" name="orderNumber" required placeholder="#3F2A9C1B" autoCapitalize="characters" aria-invalid={Boolean(err.orderNumber)} className={input} />
        </div>
        <div>
          <label htmlFor="t-email" className={label}>Email</label>
          <input id="t-email" name="email" type="email" required autoComplete="email" aria-invalid={Boolean(err.email)} className={input} />
        </div>
        <button type="submit" disabled={pending} className={button.primary}>{pending ? "Looking…" : "Track"}</button>
      </form>
      {(err.orderNumber || err.email || state.error) && (
        <p role="alert" className="text-[15px] text-danger">{err.orderNumber ?? err.email ?? state.error}</p>
      )}

      {o && (
        <section aria-live="polite" className="bg-ivory-deep p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-display text-[28px] leading-none text-espresso">Order {o.number}</p>
            <StatusBadge status={o.status} />
          </div>
          <div className="mt-8">
            <OrderTimeline order={{ status: o.status, payment_provider: o.paymentProvider as never, payment_status: o.paymentStatus as never }} />
          </div>
          <ul className="mt-8 space-y-1 text-[15px] text-espresso">
            {o.items.map((i, n) => (
              <li key={n}>{i.name}{i.colour ? `, ${i.colour}` : ""} · Qty {i.quantity}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
