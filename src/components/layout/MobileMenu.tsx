"use client";

import Link from "next/link";
import { useState } from "react";

/** Hamburger menu shown on small screens only. */
export function MobileMenu({
  links,
  isLoggedIn,
  isAdmin,
}: {
  links: { href: string; label: string }[];
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const all = [
    ...links,
    isLoggedIn ? { href: "/account", label: "My account" } : { href: "/login", label: "Log in" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="-ml-2 p-2 text-espresso"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          {open ? (
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="absolute inset-x-0 top-16 border-b border-sand bg-cream px-4 pb-6 shadow-sm"
        >
          <ul className="flex flex-col divide-y divide-sand/70">
            {all.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={close} className="block py-4 font-serif text-xl text-espresso">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
