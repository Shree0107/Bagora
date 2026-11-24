"use client";

import { useActionState } from "react";
import { saveProductAction } from "@/lib/admin-actions";
import type { FormState } from "@/lib/auth-actions";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { input, label } from "@/components/ui/styles";
import type { Category, Product, VariantSummary } from "@/types/database";

const FITS = [
  { id: "phone", label: "Phone" },
  { id: "tablet", label: "Tablet" },
  { id: "laptop-13", label: '13" laptop' },
  { id: "laptop-14", label: '14" laptop' },
  { id: "laptop-16", label: '16" laptop' },
  { id: "bottle", label: "500 ml bottle" },
  { id: "a4", label: "A4 documents" },
];

export const FAMILIES = ["black", "brown", "tan", "burgundy", "green", "cream", "grey", "blue", "pink", "other"];

/** Create / edit form. Used by /admin/products/new and /admin/products/[id]/edit. */
export function ProductForm({
  categories,
  product,
  variants = [],
  initialMessage,
}: Readonly<{
  categories: Category[];
  product?: Product;
  variants?: VariantSummary[];
  initialMessage?: FormState;
}>) {
  const [state, action] = useActionState<FormState, FormData>(saveProductAction, initialMessage ?? null);
  const num = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));

  return (
    <form action={action} className="space-y-10">
      {product && <input type="hidden" name="id" value={product.id} />}
      <FormMessage error={state?.error} success={state?.success} />

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="mb-4 font-display text-2xl text-espresso">Basics</legend>
        <div className="sm:col-span-2">
          <label htmlFor="name" className={label}>Name</label>
          <input id="name" name="name" required defaultValue={product?.name} className={input} />
        </div>
        <div>
          <label htmlFor="slug" className={label}>URL slug (optional)</label>
          <input id="slug" name="slug" defaultValue={product?.slug} placeholder="generated from the name" className={input} />
        </div>
        <div>
          <label htmlFor="categoryId" className={label}>Category</label>
          <select id="categoryId" name="categoryId" required defaultValue={product?.category_id ?? ""} className={input}>
            <option value="" disabled>Choose…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="priceInr" className={label}>Price (₹, GST included)</label>
          <input
            id="priceInr"
            name="priceInr"
            type="number"
            min={1}
            step="1"
            inputMode="numeric"
            defaultValue={product?.price_inr_paise ? product.price_inr_paise / 100 : ""}
            placeholder="Empty = not for sale"
            className={input}
          />
        </div>
        <div>
          <label htmlFor="styleRef" className={label}>Style reference (optional)</label>
          <input id="styleRef" name="styleRef" defaultValue={product?.style_ref ?? ""} placeholder="e.g. 041" className={input} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className={label}>Description</label>
          <textarea id="description" name="description" rows={5} defaultValue={product?.description} className={input} />
        </div>
      </fieldset>

      {!product && (
        <fieldset className="grid gap-6 sm:grid-cols-2">
          <legend className="mb-4 font-display text-2xl text-espresso">First colour</legend>
          <p className="-mt-2 text-sm text-muted sm:col-span-2">Add more colours after saving.</p>
          <div>
            <label htmlFor="colourName" className={label}>Colour name</label>
            <input id="colourName" name="colourName" required placeholder="e.g. Noir" className={input} />
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <div>
              <label htmlFor="colourHex" className={label}>Swatch</label>
              <input id="colourHex" name="colourHex" type="color" defaultValue="#3b2a20" className="h-12 w-16 border border-line bg-white" />
            </div>
            <div>
              <label htmlFor="colourFamily" className={label}>Filter colour</label>
              <select id="colourFamily" name="colourFamily" defaultValue="brown" className={input}>
                {FAMILIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="stock" className={label}>Stock</label>
            <input id="stock" name="stock" type="number" min={0} step="1" defaultValue={0} className={input} />
          </div>
          <div>
            <label htmlFor="sku" className={label}>SKU (optional)</label>
            <input id="sku" name="sku" className={input} />
          </div>
        </fieldset>
      )}

      <fieldset className="grid gap-6 sm:grid-cols-3">
        <legend className="mb-4 font-display text-2xl text-espresso">Size &amp; what fits</legend>
        {[
          ["width", "Width (cm)", product?.width_cm],
          ["height", "Height (cm)", product?.height_cm],
          ["depth", "Depth (cm)", product?.depth_cm],
          ["strapDrop", "Strap drop (cm)", product?.strap_drop_cm],
          ["weight", "Weight (g)", product?.weight_g],
        ].map(([name, text, value]) => (
          <div key={name as string}>
            <label htmlFor={name as string} className={label}>{text as string}</label>
            <input id={name as string} name={name as string} type="number" min={0} step="0.5" defaultValue={num(value as number | null)} className={input} />
          </div>
        ))}
        <div className="sm:col-span-3">
          <p className={label}>Fits inside</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {FITS.map((f) => (
              <label key={f.id} className="flex min-h-10 items-center gap-2 text-[15px] text-espresso">
                <input type="checkbox" name="fits" value={f.id} defaultChecked={product?.fits.includes(f.id)} className="h-4 w-4 accent-forest" />
                {f.label}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-6 sm:grid-cols-3">
        <legend className="mb-4 font-display text-2xl text-espresso">Leather &amp; hardware</legend>
        <div>
          <label htmlFor="leather" className={label}>Leather</label>
          <input id="leather" name="leather" defaultValue={product?.leather ?? ""} className={input} />
        </div>
        <div>
          <label htmlFor="hardware" className={label}>Hardware</label>
          <input id="hardware" name="hardware" defaultValue={product?.hardware ?? ""} className={input} />
        </div>
        <div>
          <label htmlFor="lining" className={label}>Lining</label>
          <input id="lining" name="lining" defaultValue={product?.lining ?? ""} className={input} />
        </div>
      </fieldset>

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="mb-4 font-display text-2xl text-espresso">Add a photo</legend>
        <p className="-mt-2 text-sm text-muted sm:col-span-2">
          JPG, PNG, WebP or AVIF, max 4 MB. Best: 1600×2000 px (4:5) on a warm ivory background.
        </p>
        <div>
          <label htmlFor="image" className={label}>Photo</label>
          <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="block text-sm" />
        </div>
        <div>
          <label htmlFor="imageAlt" className={label}>Describe the photo (for screen readers)</label>
          <input id="imageAlt" name="imageAlt" placeholder="e.g. The Cité Backpack, worn" className={input} />
        </div>
        {variants.length > 1 && (
          <div>
            <label htmlFor="imageVariantId" className={label}>Show this photo for</label>
            <select id="imageVariantId" name="imageVariantId" defaultValue="" className={input}>
              <option value="">Every colour</option>
              {variants.map((v) => <option key={v.id} value={v.id}>{v.colour_name} only</option>)}
            </select>
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-wrap gap-8">
        <legend className="sr-only">Visibility</legend>
        <label className="flex items-center gap-2 text-[15px] text-espresso">
          <input type="checkbox" name="isActive" defaultChecked={product?.is_active ?? true} className="h-4 w-4 accent-forest" />
          Visible in shop
        </label>
        <label className="flex items-center gap-2 text-[15px] text-espresso">
          <input type="checkbox" name="isFeatured" defaultChecked={product?.is_featured ?? false} className="h-4 w-4 accent-forest" />
          Featured on the home page
        </label>
      </fieldset>

      <SubmitButton pendingText="Saving…">{product ? "Save product" : "Create product"}</SubmitButton>
    </form>
  );
}
