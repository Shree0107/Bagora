"use client";

import { useActionState } from "react";
import { deleteVariantAction, saveVariantAction } from "@/lib/admin-actions";
import type { FormState } from "@/lib/auth-actions";
import { ConfirmButton } from "./ConfirmButton";
import { FAMILIES } from "./ProductForm";
import { button, inputBase } from "@/components/ui/styles";
import type { VariantSummary } from "@/types/database";

/** One row per colour (edit in place) plus an "add colour" row. */
export function VariantEditor({ productId, variants }: Readonly<{ productId: string; variants: (VariantSummary & { sku?: string | null })[] }>) {
  return (
    <div className="space-y-3">
      {variants.map((v) => (
        <VariantRow key={v.id} productId={productId} variant={v} />
      ))}
      <VariantRow productId={productId} />
    </div>
  );
}

function VariantRow({ productId, variant }: Readonly<{ productId: string; variant?: VariantSummary & { sku?: string | null } }>) {
  const [state, action] = useActionState<FormState, FormData>(saveVariantAction, null);
  const cell = `${inputBase} w-full min-h-11! py-2!`;
  return (
    <div className={`border p-4 ${variant ? "border-line" : "border-dashed border-line"}`}>
      <form action={action} className="grid items-end gap-3 sm:grid-cols-[auto_1.4fr_1fr_0.7fr_1fr_0.5fr_auto_auto]">
        {variant && <input type="hidden" name="id" value={variant.id} />}
        <input type="hidden" name="productId" value={productId} />
        <label className="text-xs text-muted">
          Swatch
          <input name="colourHex" type="color" defaultValue={variant?.colour_hex ?? "#3b2a20"} className="mt-1 block h-11 w-14 border border-line bg-white" />
        </label>
        <label className="text-xs text-muted">
          Colour name
          <input name="colourName" required defaultValue={variant?.colour_name} placeholder={variant ? "" : "New colour, e.g. Cognac"} className={cell} />
        </label>
        <label className="text-xs text-muted">
          Filter colour
          <select name="colourFamily" defaultValue={variant?.colour_family ?? "brown"} className={cell}>
            {FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted">
          Stock
          <input name="stock" type="number" min={0} defaultValue={variant?.stock ?? 0} className={cell} />
        </label>
        <label className="text-xs text-muted">
          SKU
          <input name="sku" defaultValue={variant?.sku ?? ""} className={cell} />
        </label>
        <label className="text-xs text-muted">
          Order
          <input name="sortOrder" type="number" min={0} defaultValue={variant?.sort_order ?? 0} className={cell} />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-espresso">
          <input type="checkbox" name="isActive" defaultChecked={variant?.is_active ?? true} className="h-4 w-4 accent-forest" />
          Active
        </label>
        <button type="submit" className={`${button.secondary} ${button.small}`}>{variant ? "Save" : "Add colour"}</button>
      </form>
      <div className="mt-2 flex items-center justify-between gap-4">
        <p className={`text-sm ${state?.error ? "text-danger" : "text-success"}`} role="status">{state?.error ?? state?.success ?? ""}</p>
        {variant && (
          <form action={deleteVariantAction}>
            <input type="hidden" name="id" value={variant.id} />
            <input type="hidden" name="productId" value={productId} />
            <ConfirmButton message={`Delete the colour "${variant.colour_name}"?`} className="text-xs text-muted hover:text-danger">
              Delete colour
            </ConfirmButton>
          </form>
        )}
      </div>
    </div>
  );
}
