import Link from "next/link";
import type { Category } from "@/types/database";

/** Pills linking between "All" and each category. */
export function CategoryTabs({ categories, active }: { categories: Category[]; active?: string }) {
  const tabs = [{ href: "/shop", label: "All", slug: undefined as string | undefined }].concat(
    categories.map((c) => ({ href: `/shop/${c.slug}`, label: c.name, slug: c.slug })),
  );
  return (
    <nav aria-label="Categories" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {tabs.map((t) => {
        const isActive = t.slug === active;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={isActive ? "page" : undefined}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
              isActive
                ? "border-espresso bg-espresso text-cream"
                : "border-sand text-saddle hover:border-cognac hover:text-cognac"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
