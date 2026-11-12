import Image from "next/image";

/**
 * Product photo in a fixed 4:5 frame. Works for both local sample images
 * ("/products/x.jpg") and Supabase Storage URLs.
 */
export function ProductImage({
  src,
  alt,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  className = "",
}: {
  src: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative aspect-[4/5] overflow-hidden bg-ivory ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs uppercase tracking-widest text-muted">
          No image
        </div>
      )}
    </div>
  );
}
