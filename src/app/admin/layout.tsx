import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/components/ui/styles";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · Bagora" }, robots: { index: false } };

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
];

/** Every page under /admin requires role = 'admin' (non-admins get a 404). */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <div className={`${container} py-10`}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sand pb-4">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-cognac">Admin</p>
        <nav aria-label="Admin" className="flex gap-6 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-saddle hover:text-cognac">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="pt-10">{children}</div>
    </div>
  );
}
