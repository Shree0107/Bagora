"use client";

import { useActionState, useId } from "react";
import { subscribeNewsletterAction, type FormState } from "@/lib/site-actions";
import { ArrowIcon } from "@/components/layout/Icons";

/** Email sign-up. `tone` = dark on forest (footer), light on ivory (home). */
export function NewsletterForm({ tone, source }: Readonly<{ tone: "dark" | "light"; source: "footer" | "home" }>) {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeNewsletterAction, {});
  const id = useId();
  const dark = tone === "dark";

  if (state.ok) {
    return (
      <p role="status" className={dark ? "text-[15px] text-gilt-pale" : "text-[15px] text-forest"}>
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} noValidate>
      <label htmlFor={id} className={`plate-label block ${dark ? "text-gilt" : "text-espresso"}`}>
        Letters from VÉRANE
      </label>
      <div
        className={`mt-3 flex border-b ${dark ? "border-gilt/60 focus-within:border-gilt-pale" : "border-espresso/40 focus-within:border-forest"}`}
      >
        <input
          id={id}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? `${id}-err` : undefined}
          className={`min-h-12 flex-1 bg-transparent text-[15px] focus:outline-none focus-visible:outline-none ${
            dark ? "text-ivory placeholder:text-sage" : "text-espresso placeholder:text-muted"
          }`}
        />
        <input type="hidden" name="source" value={source} />
        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <button
          type="submit"
          disabled={pending}
          aria-label="Subscribe"
          className={`flex min-h-12 w-12 items-center justify-center transition-colors disabled:opacity-50 ${
            dark ? "text-gilt hover:text-gilt-pale" : "text-forest hover:text-forest-deep"
          }`}
        >
          <ArrowIcon />
        </button>
      </div>
      {state.error && (
        <p id={`${id}-err`} role="alert" className={`mt-2 text-sm ${dark ? "text-gilt-pale" : "text-danger"}`}>
          {state.error}
        </p>
      )}
      <p className={`mt-3 text-[13px] ${dark ? "text-sage" : "text-muted"}`}>
        New pieces and quiet news, a few times a year. Unsubscribe anytime.
      </p>
    </form>
  );
}
