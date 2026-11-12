import Link from "next/link";
import { container } from "@/components/ui/styles";
import { STORE_NAME } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-24 bg-espresso text-cream/80">
      <div className={`${container} grid gap-10 py-14 sm:grid-cols-3`}>
        <div>
          <p className="font-serif text-2xl tracking-[0.2em] text-cream uppercase">{STORE_NAME}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/60">
            Considered handbags in warm leathers, made to be carried every day and loved for years.
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-tan">Shop</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/shop" className="hover:text-cream">All bags</Link></li>
            <li><Link href="/shop/totes" className="hover:text-cream">Tote bags</Link></li>
            <li><Link href="/shop/crossbody" className="hover:text-cream">Crossbody bags</Link></li>
            <li><Link href="/shop/shoulder" className="hover:text-cream">Shoulder bags</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-tan">Service</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/account" className="hover:text-cream">My account</Link></li>
            <li><Link href="/cart" className="hover:text-cream">Shopping bag</Link></li>
            <li className="text-cream/60">Free shipping on every order</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <p className={`${container} py-6 text-xs text-cream/50`}>
          © {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
