"use client";

import "./globals.css";

/** Last-resort error screen (errors thrown by the root layout itself). */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-4xl text-espresso">Something went wrong</h1>
          <p className="mt-4 text-muted">
            We couldn&apos;t load the store right now. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 rounded-full bg-cognac px-6 py-3 text-sm text-cream hover:bg-cognac-dark"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
