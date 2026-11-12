/**
 * Shared Tailwind class strings so buttons/inputs look the same everywhere.
 * Usage: <button className={button.primary}>…</button>
 */

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cognac disabled:cursor-not-allowed disabled:opacity-50";

export const button = {
  primary: `${base} bg-cognac text-cream hover:bg-cognac-dark`,
  secondary: `${base} border border-espresso/20 bg-transparent text-espresso hover:border-cognac hover:text-cognac`,
  dark: `${base} bg-espresso text-cream hover:bg-saddle`,
  danger: `${base} border border-danger/30 text-danger hover:bg-danger hover:text-cream`,
  small: "rounded-full px-4 py-2 text-xs",
};

/** Input look without a width (combine with w-24, w-auto, …). */
export const inputBase =
  "rounded-lg border border-sand bg-white/70 px-4 py-3 text-sm text-espresso placeholder:text-muted/70 focus:border-cognac focus:outline-none focus:ring-1 focus:ring-cognac";

/** Full-width input (forms). */
export const input = `w-full ${inputBase}`;

export const label = "mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-saddle";

export const container = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

export const eyebrow = "text-xs font-medium uppercase tracking-[0.25em] text-cognac";
