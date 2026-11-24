import { STATUS_LABEL } from "@/lib/orders";
import type { OrderStatus } from "@/types/database";

const styles: Record<OrderStatus, string> = {
  pending: "border-line text-muted",
  confirmed: "border-forest/40 text-forest",
  paid: "border-success/40 text-success",
  shipped: "border-gilt text-gilt-ink",
  delivered: "border-forest bg-forest text-ivory",
  cancelled: "border-danger/40 text-danger",
};

export function StatusBadge({ status, label }: Readonly<{ status: OrderStatus; label?: string }>) {
  return (
    <span className={`plate-label inline-block border px-2.5 py-1 text-[10px] ${styles[status]}`}>
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}
