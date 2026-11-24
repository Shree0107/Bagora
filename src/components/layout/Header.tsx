import Link from "next/link";
import { CartLink } from "./CartLink";
import { MobileMenu } from "./MobileMenu";
import { Logo } from "./Logo";
import { UserIcon } from "./Icons";
import { getCategories } from "@/lib/data/catalog";

const navLink =
  "plate-label text-sage transition-colors duration-300 hover:text-gilt-pale focus-visible:text-gilt-pale";

/**
 * The shop sign: a forest-painted fascia with the gilt VÉRANE lettering
 * between mouldings. Navigation is set into the fascia corners.
 */
export async function Header({ isLoggedIn, isAdmin }: Readonly<{ isLoggedIn: boolean; isAdmin: boolean }>) {
  const categories = await getCategories().catch(() => []);
  const shelves = categories.map((c) => ({ href: `/shop/${c.slug}`, label: c.name }));

  return (
    <header className="sticky top-0 z-40 bg-forest text-ivory">
      <a
        href="#main"
        className="plate-label sr-only z-50 bg-gilt px-4 py-3 text-forest-deep focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <div className="mx-auto grid h-16 w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-3 sm:px-6 lg:h-[76px] lg:px-10">
        <div className="flex items-center gap-8">
          <MobileMenu
            shelves={shelves}
            links={[
              { href: "/shop", label: "All bags" },
              { href: "/our-story", label: "Our story" },
              { href: "/track-order", label: "Track an order" },
              { href: "/contact", label: "Contact & FAQ" },
              isLoggedIn ? { href: "/account", label: "My account" } : { href: "/login", label: "Sign in" },
              ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
            ]}
          />
          <nav aria-label="Shop" className="hidden items-center gap-7 lg:flex">
            <Link href="/shop" className={navLink}>
              Shop
            </Link>
            {shelves.map((s) => (
              <Link key={s.href} href={s.href} className={navLink}>
                {s.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link href="/" aria-label="VÉRANE, home" className="px-2 text-gilt">
          <Logo className="text-[22px] sm:text-[26px] lg:text-[30px]" />
        </Link>

        <div className="flex items-center justify-end gap-5 lg:gap-7">
          <Link href="/our-story" className={`${navLink} hidden lg:inline`}>
            Our story
          </Link>
          {isAdmin && (
            <Link href="/admin" className={`${navLink} hidden lg:inline`}>
              Admin
            </Link>
          )}
          <Link
            href={isLoggedIn ? "/account" : "/login"}
            aria-label={isLoggedIn ? "My account" : "Sign in"}
            className="hidden p-1 text-sage transition-colors hover:text-gilt-pale sm:block"
          >
            <UserIcon />
          </Link>
          <CartLink />
        </div>
      </div>
      <div className="moulding h-[5px]" aria-hidden />
    </header>
  );
}
