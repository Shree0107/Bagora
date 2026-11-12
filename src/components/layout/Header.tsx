import Link from "next/link";
import { container } from "@/components/ui/styles";
import { CartLink } from "./CartLink";
import { MobileMenu } from "./MobileMenu";
import { STORE_NAME } from "@/lib/config";

export const NAV_LINKS = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop/totes", label: "Totes" },
  { href: "/shop/crossbody", label: "Crossbody" },
  { href: "/shop/shoulder", label: "Shoulder" },
];

export function Header({ isLoggedIn, isAdmin }: { isLoggedIn: boolean; isAdmin: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-sand/70 bg-cream/90 backdrop-blur">
      <div className={`${container} flex h-16 items-center justify-between gap-4`}>
        <MobileMenu links={NAV_LINKS} isLoggedIn={isLoggedIn} isAdmin={isAdmin} />

        <Link href="/" className="font-serif text-2xl tracking-[0.2em] text-espresso uppercase">
          {STORE_NAME}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-saddle transition-colors hover:text-cognac">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          {isAdmin && (
            <Link href="/admin" className="hidden text-sm text-saddle hover:text-cognac md:inline">
              Admin
            </Link>
          )}
          <Link
            href={isLoggedIn ? "/account" : "/login"}
            className="hidden text-sm text-saddle hover:text-cognac md:inline"
          >
            {isLoggedIn ? "Account" : "Log in"}
          </Link>
          <CartLink />
        </div>
      </div>
    </header>
  );
}
