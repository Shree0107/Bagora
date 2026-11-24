import Link from "next/link";
import { StarIcon } from "@/components/layout/Icons";
import { ReviewForm } from "./ReviewForm";
import { formatDate } from "@/lib/format";
import type { Review } from "@/types/database";

/** Verified-buyer reviews. Nothing is shown that a customer didn't write. */
export function Reviews({
  productId,
  slug,
  name,
  reviews,
  average,
  canReview,
  isLoggedIn,
  defaultName,
}: Readonly<{
  productId: string;
  slug: string;
  name: string;
  reviews: Review[];
  average: number | null;
  canReview: boolean;
  isLoggedIn: boolean;
  defaultName: string;
}>) {
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-28">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="reviews-title" className="font-display text-[clamp(2.2rem,4vw,3.25rem)] leading-none text-espresso">
            Reviews
          </h2>
          {average !== null ? (
            <div className="mt-5 flex items-center gap-3">
              <span className="flex text-gilt-ink" aria-hidden>
                {[1, 2, 3, 4, 5].map((n) => (
                  <StarIcon key={n} size={18} filled={n <= Math.round(average)} />
                ))}
              </span>
              <p className="tabular text-espresso">
                {average.toFixed(1)} out of 5 · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </p>
            </div>
          ) : (
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-muted">
              No reviews yet. Reviews come only from customers who have received this bag.
            </p>
          )}

          <div className="mt-8">
            {canReview ? (
              <ReviewForm productId={productId} slug={slug} defaultName={defaultName} />
            ) : isLoggedIn ? (
              <p className="text-[15px] text-muted">You can review {name} once you have received it.</p>
            ) : (
              <p className="text-[15px] text-muted">
                Bought this bag?{" "}
                <Link href={`/login?next=/products/${slug}%23reviews`} className="text-forest underline decoration-gilt underline-offset-4">
                  Sign in
                </Link>{" "}
                to share your thoughts.
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          {reviews.length > 0 && (
            <ul className="divide-y divide-line border-y border-line">
              {reviews.map((r) => (
                <li key={r.id} className="py-7">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex text-gilt-ink" aria-label={`${r.rating} out of 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <StarIcon key={n} filled={n <= r.rating} />
                      ))}
                    </span>
                    <p className="text-[13px] text-muted">{formatDate(r.created_at)}</p>
                  </div>
                  {r.title && <h3 className="mt-3 font-display text-xl text-espresso">{r.title}</h3>}
                  <p className="mt-2 max-w-[65ch] text-[15px] leading-relaxed text-espresso">{r.body}</p>
                  <p className="mt-3 text-[13px] text-muted">{r.author_name} · Verified buyer</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
