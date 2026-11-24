"use client";

import { MinusIcon, PlusIcon } from "@/components/layout/Icons";

/** − 1 + control. */
export function QuantityStepper({
  value,
  max,
  min = 1,
  onChange,
  disabled = false,
  label = "",
}: Readonly<{
  value: number;
  max: number;
  min?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** What the quantity is for (screen readers). */
  label?: string;
}>) {
  const btn = "flex h-11 w-11 items-center justify-center text-espresso hover:text-forest disabled:opacity-30";
  return (
    <div className="inline-flex items-center border border-line" role="group" aria-label={label ? `Quantity, ${label}` : "Quantity"}>
      <button type="button" className={btn} aria-label="Decrease quantity" disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>
        <MinusIcon />
      </button>
      <span className="tabular w-8 text-center text-[15px]" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} aria-label="Increase quantity" disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
        <PlusIcon />
      </button>
    </div>
  );
}
