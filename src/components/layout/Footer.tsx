import Link from "next/link";
import { Logo } from "./Logo";
import { InstagramIcon } from "./Icons";
import { NewsletterForm } from "@/components/home/NewsletterForm";
import { INSTAGRAM_HANDLE, STORE_TAGLINE, STORE_TAGLINE_EN } from "@/lib/config";
import { getCategories } from "@/lib/data/catalog";

const link = "text-sage transition-colors hover:text-gilt-pale";
const head = "plate-label text-gilt";

/** The façade's base: forest joinery, gilt lettering, the newsletter at the door. */
export async function Footer() {
  const categories = await getCategories().catch(() => []);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-forest text-ivory">
      <div className="moulding h-[5px]" aria-hidden />
      <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-10 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo className="text-[30px] text-gilt" />
            <p className="mt-5 font-display text-2xl text-ivory italic">{STORE_TAGLINE}</p>
            <p className="mt-1 text-sm text-sage">{STORE_TAGLINE_EN}. Genuine leather handbags, crafted in India.</p>
            <div className="mt-8 max-w-sm">
              <NewsletterForm tone="dark" source="footer" />
            </div>
          </div>

          <nav aria-label="Shop">
            <p className={head}>Shop</p>
            <ul className="mt-5 space-y-3 text-[15px]">
              <li>
                <Link href="/shop" className={link}>
                  All bags
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/shop/${c.slug}`} className={link}>
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/our-story" className={link}>
                  Our story
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Help">
            <p className={head}>Help</p>
            <ul className="mt-5 space-y-3 text-[15px]">
              <li><Link href="/contact" className={link}>Contact &amp; FAQ</Link></li>
              <li><Link href="/shipping-returns" className={link}>Shipping &amp; returns</Link></li>
              <li><Link href="/track-order" className={link}>Track an order</Link></li>
              <li><Link href="/account" className={link}>My account</Link></li>
            </ul>
          </nav>

          <div>
            <p className={head}>Follow</p>
            <a
              href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${link} mt-5 inline-flex items-center gap-2 text-[15px]`}
            >
              <InstagramIcon />@{INSTAGRAM_HANDLE}
            </a>
            <p className={`${head} mt-10`}>We accept</p>
            <p className="mt-4 text-[15px] leading-relaxed text-sage">UPI · Cards · Netbanking · Wallets · Cash on Delivery</p>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-gilt/30 pt-6 text-[13px] text-sage sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} VÉRANE. Prices in ₹, GST included.</p>
          <ul className="flex gap-6">
            <li><Link href="/privacy" className={link}>Privacy</Link></li>
            <li><Link href="/terms" className={link}>Terms</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
