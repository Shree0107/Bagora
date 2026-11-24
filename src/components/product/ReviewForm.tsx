"use client";

import { useActionState, useState } from "react";
import { submitReviewAction, type FormState } from "@/lib/site-actions";
import { StarIcon } from "@/components/layout/Icons";
import { button, input, label } from "@/components/ui/styles";

export function ReviewForm({ productId, slug, defaultName }: Readonly<{ productId: string; slug: string; defaultName: string }>) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitReviewAction, {});
  const [rating, setRating] = useState(0);
  const [open, setOpen] = useState(false);
  const err = state.fieldErrors ?? {};

  if (state.ok) return <p role="status" className="text-[15px] text-forest">{state.message}</p>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={button.secondary}>
        Write a review
      </button>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="slug" value={slug} />
      <fieldset>
        <legend className={label}>Your rating</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer p-1 text-gilt-ink">
              <input type="radio" name="rating" value={n} className="sr-only" checked={rating === n} onChange={() => setRating(n)} />
              <StarIcon size={26} filled={n <= rating} />
              <span className="sr-only">{n} {n === 1 ? "star" : "stars"}</span>
            </label>
          ))}
        </div>
        {err.rating && <p className="mt-1 text-sm text-danger">{err.rating}</p>}
      </fieldset>
      <div>
        <label htmlFor="rv-title" className={label}>Title (optional)</label>
        <input id="rv-title" name="title" maxLength={120} className={input} />
      </div>
      <div>
        <label htmlFor="rv-body" className={label}>Your review</label>
        <textarea id="rv-body" name="body" rows={5} required minLength={10} maxLength={2000} className={`${input} min-h-32`} aria-invalid={Boolean(err.body)} />
        {err.body && <p className="mt-1 text-sm text-danger">{err.body}</p>}
      </div>
      <div>
        <label htmlFor="rv-name" className={label}>Name to show</label>
        <input id="rv-name" name="authorName" defaultValue={defaultName} maxLength={60} required className={input} />
      </div>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className={button.primary}>
        {pending ? "Publishing…" : "Publish review"}
      </button>
    </form>
  );
}
