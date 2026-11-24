/**
 * The VÉRANE wordmark: Cormorant Garamond capitals with wide tracking, as
 * gilt signage. Text (not an image) so it stays sharp and accessible.
 * The trailing tracking is cancelled with a negative margin so it centres optically.
 */
export function Logo({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <span
      className={`inline-block font-display font-medium uppercase leading-none tracking-[0.34em] [margin-right:-0.34em] ${className}`}
    >
      VÉRANE
    </span>
  );
}
