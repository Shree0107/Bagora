import Link from "next/link";
import { button, container } from "@/components/ui/styles";
import { getCategories } from "@/lib/data/catalog";

export default async function NotFound() {
  const categories = await getCategories().catch(() => []);
  return (
    <div className="bg-ivory">
      <div className={`${container} grid gap-12 py-24 sm:py-32 lg:grid-cols-12`}>
        <div className="lg:col-span-7">
          <h1 className="font-display text-[clamp(3rem,9vw,6.5rem)] leading-[0.95] text-espresso">
            This page has <em className="text-forest">wandered off.</em>
          </h1>
          <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted">
            The link may be old, or the bag may have moved to another shelf. The collection is still right here.
          </p>
          <Link href="/shop" className={`${button.primary} mt-10`}>Discover the collection</Link>
        </div>
        {categories.length > 0 && (
          <nav aria-label="Shelves" className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <ul className="border-t border-line">
              {categories.map((c) => (
                <li key={c.id} className="border-b border-line">
                  <Link href={`/shop/${c.slug}`} className="flex min-h-14 items-center justify-between font-display text-2xl text-espresso hover:text-forest">
                    {c.name} <span aria-hidden className="text-gilt-ink">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
