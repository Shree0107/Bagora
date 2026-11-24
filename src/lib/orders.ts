import type { Order, OrderStatus } from "@/types/database";

/** All fulfilment statuses, in workflow order (single source of truth). */
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const satisfies readonly OrderStatus[];

/** Customer-facing wording. */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  confirmed: "Confirmed",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Timeline steps for an order, with the current step marked. */
export function orderTimeline(order: Pick<Order, "status" | "payment_provider" | "payment_status">) {
  const cod = order.payment_provider === "cod";
  const steps = [
    { id: "placed", label: "Order placed" },
    { id: "confirmed", label: cod ? "Confirmed · pay on delivery" : "Payment received" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: cod ? "Delivered & paid" : "Delivered" },
  ];
  const reached: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 1,
    paid: 1,
    shipped: 2,
    delivered: 3,
    cancelled: -1,
  };
  return { steps, current: reached[order.status], cancelled: order.status === "cancelled" };
}
