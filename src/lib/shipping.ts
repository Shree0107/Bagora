/**
 * Shipping methods (India). Safe to import on server AND client.
 * The server recalculates the cost from this file at checkout; the browser
 * never sends a shipping price.
 *
 * To change rates: edit `amount` (paise) and `freeOver` (order subtotal in
 * paise from which shipping is free, or null).
 *
 * `estimate` is shown to customers. Leave it null until your courier has
 * confirmed delivery times, so we never promise unconfirmed dates.
 */
export type ShippingMethod = {
  id: string;
  label: string;
  amount: number;
  freeOver: number | null;
  estimate: string | null;
};

export const SHIPPING_METHODS: ShippingMethod[] = [
  { id: "standard", label: "Standard delivery across India", amount: 0, freeOver: null, estimate: null },
];

export function getShippingMethod(id: string): ShippingMethod | null {
  return SHIPPING_METHODS.find((m) => m.id === id) ?? null;
}

/** Shipping cost (paise) for a subtotal. */
export function shippingCost(method: ShippingMethod, subtotal: number): number {
  return method.freeOver !== null && subtotal >= method.freeOver ? 0 : method.amount;
}
