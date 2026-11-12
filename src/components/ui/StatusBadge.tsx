import type { OrderStatus } from "@/types/database";

const styles: Record<OrderStatus, string> = {
  pending: "bg-sand text-saddle",
  paid: "bg-success/10 text-success",
  shipped: "bg-tan/25 text-cognac-dark",
  delivered: "bg-espresso text-cream",
  cancelled: "bg-danger/10 text-danger",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium capitalize tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
}
