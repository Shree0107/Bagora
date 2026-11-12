import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { button } from "@/components/ui/styles";

export default async function AdminHomePage() {
  await requireAdmin();
  const supabase = await createClient();
  const [products, lowStock, paidOrders, revenue] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).lte("stock", 3),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
    supabase.from("orders").select("total_cents").in("status", ["paid", "shipped", "delivered"]),
  ]);

  const totalRevenue = (revenue.data ?? []).reduce((s, o) => s + o.total_cents, 0);
  const stats = [
    { label: "Products", value: String(products.count ?? 0), href: "/admin/products" },
    { label: "Low stock (≤ 3)", value: String(lowStock.count ?? 0), href: "/admin/products" },
    { label: "Orders to ship", value: String(paidOrders.count ?? 0), href: "/admin/orders?status=paid" },
    { label: "Revenue", value: formatPrice(totalRevenue), href: "/admin/orders" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl text-espresso">Overview</h1>
        <Link href="/admin/products/new" className={button.primary}>
          Add product
        </Link>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-sm border border-sand bg-ivory/50 p-6 hover:border-cognac">
            <p className="text-xs uppercase tracking-[0.15em] text-muted">{s.label}</p>
            <p className="mt-3 font-serif text-3xl text-espresso">{s.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
