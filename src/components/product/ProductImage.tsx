import Image from "next/image";

/**
 * A bag on its ivory plinth, in a fixed 4:5 frame. Works for local images
 * ("/products/x.webp") and Supabase Storage URLs. With no photo yet it shows a
 * quiet placeholder (the VÉRANE V) instead of a broken frame.
 */
export function ProductImage({
  src,
  alt,
  sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 50vw",
  priority = false,
  className = "",
  zoom = true,
}: Readonly<{
  src: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Slow zoom when the surrounding `group` is hovered. */
  zoom?: boolean;
}>) {
  return (
    <div className={`relative aspect-[4/5] overflow-hidden bg-ivory-deep ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover ${zoom ? "transition-transform duration-[1200ms] ease-[var(--ease-out-quint)] motion-safe:group-hover:scale-[1.04]" : ""}`}
        />
      ) : (
        <Placeholder label={alt} />
      )}
    </div>
  );
}

/** Ivory frame with a small gilt V, used wherever a photo hasn't been supplied yet. */
export function Placeholder({ label, className = "" }: Readonly<{ label: string; className?: string }>) {
  return (
    <div
      role="img"
      aria-label={`${label} (photo coming soon)`}
      className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-ivory-deep ${className}`}
    >
      <span aria-hidden className="font-display text-5xl text-gilt">
        V
      </span>
      <span aria-hidden className="plate-label text-gilt-ink">
        Photo coming soon
      </span>
    </div>
  );
}
