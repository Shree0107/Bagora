"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CheckIcon, CloseIcon } from "@/components/layout/Icons";
import { button } from "@/components/ui/styles";

type Colour = { id: string; label: string; hex: string };
type Band = { id: string; label: string };
type Shelf = { slug: string; name: string };

type Props = Readonly<{
  children: React.ReactNode;
  shelves: Shelf[];
  activeShelf?: string;
  colours: Colour[];
  bands: Band[];
  count: number;
}>;

const SORTS = [
  { id: "", label: "Recommended" },
  { id: "newest", label: "Newest" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
];

/**
 * Category, colour, price and stock filters + sort. State lives in the URL
 * (?colour=black,tan&price=4000-5000&stock=1&sort=price_asc) so filtered pages
 * can be shared and the server does the filtering.
 * Desktop: a quiet rail. Phones: a bottom sheet.
 */
export function ShopFilters({ children, shelves, activeShelf, colours, bands, count }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [sheet, setSheet] = useState(false);

  const selectedColours = new Set((params.get("colour") ?? "").split(",").filter(Boolean));
  const price = params.get("price") ?? "";
  const stock = params.get("stock") === "1";
  const sort = params.get("sort") ?? "";
  const activeCount = selectedColours.size + (price ? 1 : 0) + (stock ? 1 : 0);
  const query = params.toString();

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function toggleColour(id: string) {
    const next = new Set(selectedColours);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    update({ colour: [...next].join(",") || null });
  }

  const clear = () => update({ colour: null, price: null, stock: null });

  const controls = (
    <div className="space-y-10">
      <fieldset>
        <legend className="plate-label text-espresso">Shape</legend>
        <ul className="mt-4 space-y-1">
          {[{ slug: "", name: "All bags" }, ...shelves].map((s) => {
            const href = `${s.slug ? `/shop/${s.slug}` : "/shop"}${query ? `?${query}` : ""}`;
            const active = (activeShelf ?? "") === s.slug;
            return (
              <li key={s.slug || "all"}>
                <Link
                  href={href}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setSheet(false)}
                  className={`flex min-h-10 items-center gap-3 text-[15px] transition-colors ${
                    active ? "text-forest" : "text-muted hover:text-espresso"
                  }`}
                >
                  <span aria-hidden className={`h-px w-4 transition-colors ${active ? "bg-forest" : "bg-transparent"}`} />
                  {s.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {colours.length > 0 && (
        <fieldset>
          <legend className="plate-label text-espresso">Colour</legend>
          <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1 lg:grid-cols-1">
            {colours.map((c) => {
              const on = selectedColours.has(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggleColour(c.id)}
                    className="flex min-h-10 w-full items-center gap-3 text-left text-[15px] text-espresso"
                  >
                    <span
                      aria-hidden
                      className={`relative flex h-5 w-5 shrink-0 items-center justify-center border ${on ? "border-forest outline outline-1 outline-offset-2 outline-forest" : "border-espresso/25"}`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {on && <CheckIcon size={12} className={c.id === "cream" ? "text-espresso" : "text-ivory"} />}
                    </span>
                    {c.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      <fieldset>
        <legend className="plate-label text-espresso">Price</legend>
        <ul className="mt-4 space-y-1">
          {[{ id: "", label: "Any price" }, ...bands].map((b) => (
            <li key={b.id || "any"}>
              <label className="flex min-h-10 cursor-pointer items-center gap-3 text-[15px] text-espresso">
                <input
                  type="radio"
                  name="price"
                  checked={price === b.id}
                  onChange={() => update({ price: b.id || null })}
                  className="h-4 w-4 accent-forest"
                />
                <span className="tabular">{b.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <label className="flex min-h-10 cursor-pointer items-center gap-3 text-[15px] text-espresso">
        <input
          type="checkbox"
          checked={stock}
          onChange={(e) => update({ stock: e.target.checked ? "1" : null })}
          className="h-4 w-4 accent-forest"
        />
        In stock only
      </label>

      {activeCount > 0 && (
        <button type="button" onClick={clear} className="text-[15px] text-forest underline decoration-gilt underline-offset-4">
          Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-14">
      <aside aria-label="Filters" className="hidden pt-8 lg:block">
        <div className="sticky top-28">{controls}</div>
      </aside>
      <div>
      {/* Toolbar: count + sort (all sizes), Filter button (phones) */}
      <div className="flex items-center justify-between gap-4 border-y border-line py-3">
        <p className="tabular text-[15px] text-muted" aria-live="polite">
          {pending ? "Updating…" : `${count} ${count === 1 ? "bag" : "bags"}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="plate-label flex min-h-11 items-center gap-2 border border-line px-4 text-espresso lg:hidden"
            aria-haspopup="dialog"
          >
            Filter{activeCount > 0 && <span className="tabular text-forest">({activeCount})</span>}
          </button>
          <label className="sr-only" htmlFor="sort">
            Sort by
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => update({ sort: e.target.value || null })}
            className="plate-label min-h-11 cursor-pointer border border-line bg-transparent px-3 text-espresso focus:border-forest focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-10">{children}</div>
      </div>

      {sheet && (
        <Sheet onClose={() => setSheet(false)} count={count} pending={pending}>
          {controls}
        </Sheet>
      )}
    </div>
  );
}

function Sheet({
  onClose,
  count,
  pending,
  children,
}: Readonly<{ onClose: () => void; count: number; pending: boolean; children: React.ReactNode }>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
      <button type="button" aria-label="Close filters" onClick={onClose} className="absolute inset-0 bg-forest-deep/50 motion-safe:animate-[fade-in_300ms_ease-out]" />
      <div
        ref={ref}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 flex max-h-[88svh] flex-col bg-ivory focus:outline-none motion-safe:animate-[menu-in_400ms_var(--ease-out-quint)]"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="font-display text-2xl text-espresso">Filter</p>
          <button type="button" onClick={onClose} aria-label="Close filters" className="-mr-2 flex h-11 w-11 items-center justify-center">
            <CloseIcon />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-6">{children}</div>
        <div className="border-t border-line p-4">
          <button type="button" onClick={onClose} className={`${button.primary} w-full`}>
            {pending ? "Updating…" : `Show ${count} ${count === 1 ? "bag" : "bags"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
