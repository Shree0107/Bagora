"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "./Icons";

type L = { href: string; label: string };

/** Full-height menu for small screens: the shelves in large signage, service links below. */
export function MobileMenu({ shelves, links }: Readonly<{ shelves: L[]; links: L[] }>) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close when navigating.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (e.key === "Tab" && panelRef.current) {
        const items = [...panelRef.current.querySelectorAll<HTMLElement>("a, button")];
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
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label="Open menu"
        className="flex h-11 w-11 items-center justify-center text-sage hover:text-gilt-pale"
      >
        <MenuIcon />
      </button>

      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-forest px-6 pt-4 pb-10 text-ivory motion-safe:animate-[menu-in_400ms_var(--ease-out-quint)]"
        >
          <div className="flex h-12 items-center justify-between">
            <span className="sign text-[22px] text-gilt">Vérane</span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
              aria-label="Close menu"
              className="-mr-2 flex h-11 w-11 items-center justify-center text-sage hover:text-gilt-pale"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="moulding mt-3 h-[5px]" aria-hidden />

          <nav aria-label="Shelves" className="mt-8">
            <ul className="space-y-1">
              {shelves.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="block py-2 font-display text-[40px] leading-tight text-ivory transition-colors hover:text-gilt-pale"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="More" className="mt-auto pt-10">
            <ul className="border-t border-gilt/40">
              {links.map((l) => (
                <li key={l.href} className="border-b border-gilt/20">
                  <Link href={l.href} className="plate-label flex min-h-12 items-center text-sage hover:text-gilt-pale">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
