/**
 * Shared class strings so plaques (buttons), fields and layout look the same everywhere.
 * Usage: <button className={button.primary}>…</button>
 *
 * Buttons are "glass-door plaques": square, a gilt hairline frame, small tracked
 * capitals. Primary = forest with gilt-pale lettering.
 */

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.24em] transition-[background-color,color,border-color] duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-50";

export const button = {
  primary: `${base} border border-forest bg-forest text-ivory hover:bg-forest-deep hover:text-gilt-pale`,
  secondary: `${base} border border-espresso/30 bg-transparent text-espresso hover:border-forest hover:text-forest`,
  /** On forest grounds */
  gilt: `${base} border border-gilt bg-transparent text-ivory hover:bg-gilt hover:text-forest-deep`,
  dark: `${base} border border-espresso bg-espresso text-ivory hover:bg-forest hover:border-forest`,
  danger: `${base} border border-danger/40 text-danger hover:bg-danger hover:text-ivory`,
  small: "min-h-10! px-5! py-2.5! text-[10px]!",
};

/** Text link with a hairline underline. */
export const textLink =
  "text-forest underline decoration-gilt underline-offset-4 transition-colors hover:text-forest-deep hover:decoration-forest";

/** Field look without a width (combine with w-24, w-auto, …). */
export const inputBase =
  "min-h-12 border border-line bg-white/60 px-4 py-3 text-[15px] text-espresso placeholder:text-muted/80 transition-colors focus:border-forest focus:bg-white focus:outline-none focus-visible:outline-none";

/** Full-width field (forms). */
export const input = `w-full ${inputBase}`;

export const label = "mb-1.5 block text-[11px] font-medium uppercase tracking-[0.2em] text-espresso";

export const container = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10";

/** Narrow reading column. */
export const prose = "mx-auto w-full max-w-[68ch] px-4 sm:px-6";

/**
 * Kept for older screens (admin/auth). New storefront sections never put a label
 * above a heading; the heading carries its own weight.
 */
export const eyebrow = "text-[11px] font-medium uppercase tracking-[0.3em] text-gilt-ink";
