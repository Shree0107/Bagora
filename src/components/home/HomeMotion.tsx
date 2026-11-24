"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * "Stepping inside": as the visitor scrolls past the shop window, the window
 * frame eases outward and dims slightly while the ivory interior below rises
 * into place. One authored moment, scrubbed to scroll; nothing else on the
 * page animates on scroll. Content is visible by default (no JS needed), and
 * reduced-motion visitors get no movement at all.
 */
export function HomeMotion({ children }: Readonly<{ children: React.ReactNode }>) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const windowEl = root.current?.querySelector<HTMLElement>("[data-window]");
        const interior = root.current?.querySelector<HTMLElement>("[data-interior]");
        if (!windowEl || !interior) return;

        gsap.to(windowEl, {
          scale: 1.035,
          opacity: 0.72,
          ease: "none",
          scrollTrigger: { trigger: windowEl, start: "top top", end: "bottom top", scrub: 0.6 },
        });
        gsap.from(interior, {
          y: 56,
          ease: "none",
          scrollTrigger: { trigger: interior, start: "top bottom", end: "top 55%", scrub: 0.6 },
        });
      });
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}
