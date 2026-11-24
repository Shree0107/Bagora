import type { Metadata } from "next";
import { ShopView } from "@/components/product/ShopView";
import { parseFilters } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "All bags",
  description: "Genuine leather totes, crossbody, shoulder and work bags from VÉRANE. Prices in ₹, GST included.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  return <ShopView category={null} filters={parseFilters(await searchParams)} />;
}
