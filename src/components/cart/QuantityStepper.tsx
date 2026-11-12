"use client";

/** − 1 + control. */
export function QuantityStepper({
  value,
  max,
  min = 1,
  onChange,
  disabled = false,
}: {
  value: number;
  max: number;
  min?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const btn =
    "flex h-11 w-10 items-center justify-center text-lg text-saddle hover:text-cognac disabled:opacity-30";
  return (
    <div className="inline-flex items-center rounded-full border border-sand">
      <button
        type="button"
        className={btn}
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
