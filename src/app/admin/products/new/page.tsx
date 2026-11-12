import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await getCategories();
  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="text-sm text-cognac hover:underline">
        ← All products
      </Link>
      <h1 className="mt-6 mb-10 text-4xl text-espresso">New product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
