"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { button, inputBase } from "@/components/ui/styles";

/**
 * Sort + price filters. State lives in the URL (?sort=&min=&max=&stock=1)
 * so filtered pages can be shared and the server does the filtering.
 */
export function ShopFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const hasFilters = params.has("min") || params.has("max") || params.has("stock") || params.has("sort");

  return (
    <div className="flex flex-col gap-4 border-y border-sand/70 py-4 md:flex-row md:items-end md:justify-between">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          update({ min: min.trim() || null, max: max.trim() || null });
        }}
      >
        <label className="flex flex-col text-xs text-muted">
          Min €
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className={`${inputBase} mt-1 w-24 py-2`}
          />
        </label>
        <label className="flex flex-col text-xs text-muted">
          Max €
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className={`${inputBase} mt-1 w-24 py-2`}
          />
        </label>
        <button type="submit" className={`${button.secondary} ${button.small}`}>
          Apply
        </button>
        <label className="flex items-center gap-2 py-2 text-sm text-saddle">
          <input
            type="checkbox"
            checked={params.get("stock") === "1"}
            onChange={(e) => update({ stock: e.target.checked ? "1" : null })}
            className="h-4 w-4 accent-cognac"
          />
          In stock only
        </label>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setMin("");
              setMax("");
              router.push(pathname, { scroll: false });
            }}
            className="py-2 text-sm text-cognac underline-offset-4 hover:underline"
          >
            Clear
          </button>
        )}
      </form>

      <label className="flex items-center gap-3 whitespace-nowrap text-sm text-saddle">
        Sort by
        <select
          value={params.get("sort") ?? "newest"}
          onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })}
          className={`${inputBase} w-auto py-2`}
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </label>
    </div>
  );
}
