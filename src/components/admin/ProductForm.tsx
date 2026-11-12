"use client";

import { useActionState } from "react";
import { saveProductAction } from "@/lib/admin-actions";
import type { FormState } from "@/lib/auth-actions";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { input, label } from "@/components/ui/styles";
import type { Category, Product } from "@/types/database";

/** Create / edit form. Used by /admin/products/new and /admin/products/[id]/edit. */
export function ProductForm({
  categories,
  product,
  initialMessage,
}: {
  categories: Category[];
  product?: Product;
  initialMessage?: FormState;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveProductAction, initialMessage ?? null);

  return (
    <form action={action} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      <FormMessage error={state?.error} success={state?.success} />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className={label}>Name</label>
          <input id="name" name="name" required defaultValue={product?.name} className={input} />
        </div>

        <div>
          <label htmlFor="slug" className={label}>URL slug (optional)</label>
          <input
            id="slug"
            name="slug"
            defaultValue={product?.slug}
            placeholder="generated from the name"
            className={input}
          />
        </div>

        <div>
          <label htmlFor="categoryId" className={label}>Category</label>
          <select id="categoryId" name="categoryId" required defaultValue={product?.category_id ?? ""} className={input}>
            <option value="" disabled>
              Choose…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="price" className={label}>Price (€)</label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0.5"
            required
            defaultValue={product ? (product.price_cents / 100).toFixed(2) : ""}
            className={input}
          />
        </div>

        <div>
          <label htmlFor="stock" className={label}>Stock</label>
          <input
            id="stock"
            name="stock"
            type="number"
            step="1"
            min="0"
            required
            defaultValue={product?.stock ?? 0}
            className={input}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className={label}>Description</label>
          <textarea
            id="description"
            name="description"
            rows={6}
            defaultValue={product?.description}
            className={input}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="image" className={label}>{product ? "Add an image" : "Image"}</label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="block w-full text-sm text-saddle file:mr-4 file:rounded-full file:border-0 file:bg-espresso file:px-4 file:py-2 file:text-xs file:text-cream"
          />
          <p className="mt-1 text-xs text-muted">JPG, PNG, WebP or AVIF, max 4 MB. Portrait (4:5) photos look best.</p>
        </div>

        <label className="flex items-center gap-3 text-sm text-espresso">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={product?.is_active ?? true}
            className="h-4 w-4 accent-cognac"
          />
          Visible in shop
        </label>
        <label className="flex items-center gap-3 text-sm text-espresso">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={product?.is_featured ?? false}
            className="h-4 w-4 accent-cognac"
          />
          Featured on home page
        </label>
      </div>

      <SubmitButton pendingText="Saving…">{product ? "Save changes" : "Create product"}</SubmitButton>
    </form>
  );
}
