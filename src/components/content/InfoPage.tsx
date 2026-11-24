import { container } from "@/components/ui/styles";

/** Long-form pages (help, legal): a forest title band, then a calm reading column. */
export function InfoPage({
  title,
  intro,
  children,
  aside,
}: Readonly<{ title: string; intro?: React.ReactNode; children: React.ReactNode; aside?: React.ReactNode }>) {
  return (
    <div className="bg-ivory">
      <header className="bg-forest text-ivory">
        <div className={`${container} py-16 sm:py-20`}>
          <h1 className="font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-none">{title}</h1>
          {intro && <div className="mt-5 max-w-2xl text-[17px] leading-relaxed text-sage">{intro}</div>}
        </div>
        <div className="moulding h-[5px]" aria-hidden />
      </header>
      <div className={`${container} grid gap-14 py-16 sm:py-20 lg:grid-cols-12`}>
        <div className="prose-verane lg:col-span-7">{children}</div>
        {aside && <aside className="lg:col-span-4 lg:col-start-9">{aside}</aside>}
      </div>
    </div>
  );
}

/** An FAQ entry (native disclosure: keyboard and screen-reader friendly). */
export function Faq({ q, children }: Readonly<{ q: string; children: React.ReactNode }>) {
  return (
    <details className="group border-b border-line">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-[17px] text-espresso [&::-webkit-details-marker]:hidden">
        {q}
        <span aria-hidden className="text-xl text-gilt-ink transition-transform duration-300 group-open:rotate-45">+</span>
      </summary>
      <div className="pb-6 text-[15px] leading-relaxed text-muted">{children}</div>
    </details>
  );
}
