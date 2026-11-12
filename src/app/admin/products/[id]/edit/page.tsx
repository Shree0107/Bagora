import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ProductImage } from "@/components/product/ProductImage";
import { button } from "@/components/ui/styles";
import { getCategories } from "@/lib/data/catalog";
import { createClient } from "@/lib/supabase/server";
import { deleteProductAction, deleteProductImageAction } from "@/lib/admin-actions";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const { saved, error } = await searchParams;

  const supabase = await createClient();
  const [{ data: product }, categories] = await Promise.all([
    supabase.from("products").select("*, product_images(*)").eq("id", id).maybeSingle(),
    getCategories(),
  ]);
  if (!product) notFound();

  const { product_images, ...productRow } = product;
  const images = [...product_images].sort((a, b) => a.sort_order - b.sort_order);
  const initialMessage = typeof error === "string" ? { error } : saved ? { success: "Product created." } : null;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="text-sm text-cognac hover:underline">
        ← All products
      </Link>
      <div className="mt-6 mb-10 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl text-espresso">{product.name}</h1>
        {product.is_active && (
          <Link href={`/products/${product.slug}`} className="text-sm text-cognac hover:underline">
            View in shop →
          </Link>
        )}
      </div>

      <section className="mb-10">
        <h2 className="text-xl text-espresso">Images</h2>
        {images.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No images yet. Add one below.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-5">
            {images.map((img) => (
              <li key={img.id}>
                <ProductImage src={img.url} alt={img.alt} sizes="120px" className="rounded-sm" />
                <form action={deleteProductImageAction} className="mt-2 text-center">
                  <input type="hidden" name="imageId" value={img.id} />
                  <ConfirmButton message="Remove this image?" className="text-xs text-muted hover:text-danger">
                    Remove
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProductForm categories={categories} product={productRow} initialMessage={initialMessage} />

      <section className="mt-16 border-t border-sand pt-8">
        <h2 className="text-xl text-danger">Delete product</h2>
        <p className="mt-2 text-sm text-muted">
          This removes the product and its images. Past orders keep their own copy of the name and price.
          To hide it temporarily instead, untick &quot;Visible in shop&quot;.
        </p>
        <form action={deleteProductAction} className="mt-4">
          <input type="hidden" name="id" value={product.id} />
          <ConfirmButton message={`Delete "${product.name}" permanently?`} className={button.danger}>
            Delete product
          </ConfirmButton>
        </form>
      </section>
    </div>
  );
}
