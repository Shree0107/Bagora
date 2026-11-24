import { orderTimeline } from "@/lib/orders";
import type { Order } from "@/types/database";

/** Placed → Confirmed/Paid → Shipped → Delivered, as a quiet ruled line. */
export function OrderTimeline({ order }: Readonly<{ order: Pick<Order, "status" | "payment_provider" | "payment_status"> }>) {
  const { steps, current, cancelled } = orderTimeline(order);
  if (cancelled) {
    return <p className="border border-danger/30 px-4 py-3 text-sm text-danger">This order was cancelled.</p>;
  }
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
      {steps.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s.id} aria-current={i === current ? "step" : undefined}>
            <span aria-hidden className={`block h-[3px] ${done ? "bg-forest" : "bg-line"}`} />
            <span className={`mt-3 block text-[13px] leading-snug ${done ? "text-espresso" : "text-muted"}`}>
              {s.label}
              <span className="sr-only">{done ? " (done)" : " (upcoming)"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
