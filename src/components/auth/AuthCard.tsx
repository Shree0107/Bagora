import { container } from "@/components/ui/styles";

/** The door of the shop: a quiet, centred panel used by every sign-in page. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: Readonly<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}>) {
  return (
    <div className="bg-ivory">
      <div className={`${container} flex justify-center py-16 sm:py-24`}>
        <div className="w-full max-w-md">
          <h1 className="text-center font-display text-[clamp(2.5rem,6vw,3.5rem)] leading-none text-espresso">{title}</h1>
          {subtitle && <p className="mt-4 text-center text-[15px] text-muted">{subtitle}</p>}
          <div className="mt-10 border border-line bg-ivory-deep/60 p-6 sm:p-8">{children}</div>
          {footer && <div className="mt-6 text-center text-[15px] text-muted [&_a]:text-forest [&_a]:underline [&_a]:decoration-gilt [&_a]:underline-offset-4">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
