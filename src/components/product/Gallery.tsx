"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { CloseIcon, ZoomIcon } from "@/components/layout/Icons";
import { Placeholder } from "./ProductImage";

type Img = { id: string; url: string; alt: string };

/**
 * Product photographs.
 * Phones: full-width swipe (scroll-snap) with position marks.
 * Desktop: thumbnails + main photo; hover magnifies, click opens a full-screen zoom.
 */
export function Gallery({ images, name }: Readonly<{ images: Img[]; name: string }>) {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const current = images[Math.min(index, images.length - 1)];

  // Reset when the colour (image set) changes.
  const key = images.map((i) => i.id).join();
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setIndex(0);
  }
  useEffect(() => {
    track.current?.scrollTo({ left: 0 });
  }, [key]);

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (!images.length) {
    return (
      <div className="aspect-[4/5]">
        <Placeholder label={name} />
      </div>
    );
  }

  return (
    <div>
      {/* Phones: swipe */}
      <div className="relative -mx-4 sm:-mx-6 lg:hidden">
        <div
          ref={track}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={`${name} photos`}
          role="region"
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => {
                setIndex(i);
                setZoomOpen(true);
              }}
              className="relative aspect-[4/5] w-full shrink-0 snap-center bg-ivory-deep"
              aria-label={`Zoom photo ${i + 1} of ${images.length}`}
            >
              <Image src={img.url} alt={img.alt || name} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-2" aria-hidden>
            {images.map((img, i) => (
              <span key={img.id} className={`h-px w-6 transition-colors ${i === index ? "bg-forest" : "bg-line"}`} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: thumbnails + magnifier */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[72px_1fr]">
        <ul className="space-y-3" aria-label="Choose a photo">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={`relative block aspect-[4/5] w-full overflow-hidden bg-ivory-deep outline-offset-2 transition-[outline-color] ${
                  i === index ? "outline outline-1 outline-forest" : "opacity-80 hover:opacity-100"
                }`}
              >
                <Image src={img.url} alt="" fill sizes="72px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
        <Magnifier img={current} name={name} onOpen={() => setZoomOpen(true)} />
      </div>

      {zoomOpen && (
        <Lightbox images={images} start={index} name={name} onClose={() => setZoomOpen(false)} />
      )}
    </div>
  );
}

/** Hover to magnify (2×), following the pointer. Click opens the full zoom. */
function Magnifier({ img, name, onOpen }: Readonly<{ img: Img; name: string; onOpen: () => void }>) {
  const [origin, setOrigin] = useState<string | null>(null);
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
      }}
      onMouseLeave={() => setOrigin(null)}
      className="group relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-ivory-deep"
      aria-label={`Open full-screen zoom of ${img.alt || name}`}
    >
      <Image
        src={img.url}
        alt={img.alt || name}
        fill
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 ease-out"
        style={origin ? { transform: "scale(1.8)", transformOrigin: origin } : undefined}
      />
      <span className="plate-label absolute right-4 bottom-4 flex items-center gap-2 bg-ivory/90 px-3 py-2 text-espresso opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        <ZoomIcon size={16} /> Zoom
      </span>
    </button>
  );
}

function Lightbox({
  images,
  start,
  name,
  onClose,
}: Readonly<{ images: Img[]; start: number; name: string; onClose: () => void }>) {
  const [i, setI] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const go = useCallback((d: number) => {
    setZoomed(false);
    setI((n) => (n + d + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Tab" && ref.current) {
        const items = [...ref.current.querySelectorAll<HTMLElement>("button")];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [onClose, go]);

  const img = images[i];
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`${name}, photo ${i + 1} of ${images.length}`}
      className="fixed inset-0 z-50 flex flex-col bg-ivory motion-safe:animate-[fade-in_250ms_ease-out]"
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <p className="tabular text-sm text-muted">
          {i + 1} / {images.length}
        </p>
        <button type="button" onClick={onClose} aria-label="Close zoom" className="flex h-11 w-11 items-center justify-center text-espresso">
          <CloseIcon />
        </button>
      </div>
      <div className="relative flex-1 overflow-auto">
        <button
          type="button"
          onClick={() => setZoomed((z) => !z)}
          aria-label={zoomed ? "Zoom out" : "Zoom in"}
          className={`relative mx-auto block h-full ${zoomed ? "w-[200%] max-w-none cursor-zoom-out" : "w-full cursor-zoom-in"}`}
        >
          <Image src={img.url} alt={img.alt || name} fill sizes="200vw" quality={90} className="object-contain" />
        </button>
      </div>
      {images.length > 1 && (
        <div className="flex justify-center gap-3 border-t border-line p-3">
          <button type="button" onClick={() => go(-1)} className="plate-label min-h-11 px-5 text-espresso">
            Previous
          </button>
          <button type="button" onClick={() => go(1)} className="plate-label min-h-11 px-5 text-espresso">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
