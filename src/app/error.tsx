"use client";

import Link from "next/link";
import { button, container } from "@/components/ui/styles";

/** Shown when a page throws (e.g. Supabase not configured or unreachable). */
export default function ErrorPage({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  // In development the real message is shown; in production Next.js hides it.
  const detail = process.env.NODE_ENV === "development" ? error.message : null;
  return (
    <div className="bg-ivory">
      <div className={`${container} max-w-2xl py-28 text-center`}>
        <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none text-espresso">Something went wrong</h1>
        <p className="mt-5 text-[17px] text-muted">Please try again. If it keeps happening, come back in a little while or write to us.</p>
        {detail && <p className="mt-4 font-mono text-xs text-danger">{detail}</p>}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className={button.primary}>Try again</button>
          <Link href="/contact" className={button.secondary}>Contact us</Link>
        </div>
      </div>
    </div>
  );
}
