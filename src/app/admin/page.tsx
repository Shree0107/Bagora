import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/markets";
import { button } from "@/components/ui/styles";

export default async function AdminHomePage() {
  await requireAdmin();
  const supabase = await createClient();
  const [products, lowStock, toShip, revenue, messages] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("product_variants").select("id", { count: "exact", head: true }).lte("stock", 3).eq("is_active", true),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "confirmed"]),
    supabase.from("orders").select("total_cents").eq("payment_status", "paid").eq("currency", "inr"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("handled", false),
  ]);

  const received = (revenue.data ?? []).reduce((s, o) => s + o.total_cents, 0);
  const stats = [
    { label: "Products", value: String(products.count ?? 0), href: "/admin/products" },
    { label: "Colours low on stock (≤ 3)", value: String(lowStock.count ?? 0), href: "/admin/products" },
    { label: "Orders to ship", value: String(toShip.count ?? 0), href: "/admin/orders?status=paid" },
    { label: "Unhandled messages", value: String(messages.count ?? 0), href: "/admin/messages" },
    { label: "Revenue received", value: formatMoney(received, "inr"), href: "/admin/orders" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-espresso">Overview</h1>
        <Link href="/admin/products/new" className={button.primary}>
          Add product
        </Link>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="border border-line bg-ivory-deep/50 p-6 hover:border-forest">
            <p className="text-xs uppercase tracking-[0.15em] text-muted">{s.label}</p>
            <p className="tabular mt-3 font-display text-3xl text-espresso">{s.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
