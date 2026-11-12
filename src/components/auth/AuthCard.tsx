import { container } from "@/components/ui/styles";

/** Centered card used by all auth pages. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className={`${container} flex justify-center py-16 sm:py-24`}>
      <div className="w-full max-w-md">
        <h1 className="text-center text-4xl text-espresso">{title}</h1>
        {subtitle && <p className="mt-3 text-center text-sm text-muted">{subtitle}</p>}
        <div className="mt-10 rounded-sm border border-sand bg-ivory/50 p-6 sm:p-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}
