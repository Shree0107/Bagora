import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { button } from "@/components/ui/styles";
import { FormMessage } from "@/components/ui/FormMessage";
import { ProductImage } from "@/components/product/ProductImage";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const { deleted } = await searchParams;
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*, categories(name), product_images(url, sort_order)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl text-espresso">Products</h1>
        <Link href="/admin/products/new" className={button.primary}>
          Add product
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {deleted && <FormMessage success="Product deleted." />}
        {error && <FormMessage error={error.message} />}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-sand text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="py-3 pr-4 font-medium">Product</th>
              <th className="py-3 pr-4 font-medium">Category</th>
              <th className="py-3 pr-4 font-medium">Price</th>
              <th className="py-3 pr-4 font-medium">Stock</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-sand/70">
            {(products ?? []).map((p) => {
              const img = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
              return (
                <tr key={p.id}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 shrink-0">
                        <ProductImage src={img?.url ?? null} alt="" sizes="48px" />
                      </div>
                      <div>
                        <p className="text-espresso">{p.name}</p>
                        <p className="text-xs text-muted">/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-saddle">{p.categories?.name ?? "—"}</td>
                  <td className="py-3 pr-4 tabular-nums">{formatPrice(p.price_cents)}</td>
                  <td className={`py-3 pr-4 tabular-nums ${p.stock <= 3 ? "text-danger" : ""}`}>{p.stock}</td>
                  <td className="py-3 pr-4 text-xs">
                    {p.is_active ? <span className="text-success">Visible</span> : <span className="text-muted">Hidden</span>}
                    {p.is_featured && <span className="ml-2 text-cognac">Featured</span>}
                  </td>
                  <td className="py-3 text-right">
                    <Link href={`/admin/products/${p.id}/edit`} className="text-cognac hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products?.length === 0 && <p className="py-10 text-center text-muted">No products yet.</p>}
      </div>
    </div>
  );
}
