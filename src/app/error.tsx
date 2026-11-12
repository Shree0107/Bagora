"use client";

import { button, container } from "@/components/ui/styles";

/** Shown when a page throws (e.g. Supabase not configured or unreachable). */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // In development the real message is shown; in production Next.js hides it.
  const detail = process.env.NODE_ENV === "development" ? error.message : null;
  return (
    <div className={`${container} max-w-xl py-28 text-center`}>
      <h1 className="text-4xl text-espresso">Something went wrong</h1>
      <p className="mt-4 text-muted">Please try again. If the problem continues, come back a little later.</p>
      {detail && <p className="mt-4 font-mono text-xs text-danger">{detail}</p>}
      <button type="button" onClick={reset} className={`${button.primary} mt-10`}>
        Try again
      </button>
    </div>
  );
}
