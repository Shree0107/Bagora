"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductImage } from "./ProductImage";

/** Main image + thumbnails (thumbnails only appear with 2+ images). */
export function Gallery({ images, name }: { images: { id: string; url: string; alt: string }[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];

  return (
    <div>
      <ProductImage
        src={current?.url ?? null}
        alt={current?.alt || name}
        priority
        sizes="(min-width: 768px) 50vw, 100vw"
        className="rounded-sm"
      />
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              className={`relative aspect-square overflow-hidden rounded-sm border bg-ivory ${
                i === index ? "border-cognac" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
