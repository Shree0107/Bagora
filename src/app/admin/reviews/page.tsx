import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setReviewStatusAction } from "@/lib/admin-actions";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Reviews" };

/** Verified-buyer reviews. Hide anything abusive; never edit a customer's words. */
export default async function AdminReviewsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, products(name, slug)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="font-display text-4xl text-espresso">Reviews</h1>
      <p className="mt-2 text-sm text-muted">Only customers who received a bag can review it. Hide a review to remove it from the shop.</p>
      {!reviews?.length ? (
        <p className="mt-10 text-muted">No reviews yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {reviews.map((r) => {
            const product = r.products as unknown as { name: string; slug: string } | null;
            return (
              <li key={r.id} className="grid gap-4 py-6 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-sm text-muted">
                    {product ? <Link href={`/products/${product.slug}`} className="text-forest underline">{product.name}</Link> : "Deleted product"}
                    {" · "}{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} · {r.author_name} · {formatDate(r.created_at)}
                  </p>
                  {r.title && <p className="mt-2 font-display text-xl text-espresso">{r.title}</p>}
                  <p className="mt-1 max-w-[70ch] text-[15px] text-espresso">{r.body}</p>
                </div>
                <form action={setReviewStatusAction} className="flex items-start gap-3">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value={r.status === "published" ? "hidden" : "published"} />
                  <span className={`text-sm ${r.status === "published" ? "text-success" : "text-muted"}`}>{r.status === "published" ? "Published" : "Hidden"}</span>
                  <button type="submit" className="text-sm text-forest underline decoration-gilt underline-offset-4">
                    {r.status === "published" ? "Hide" : "Publish"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
