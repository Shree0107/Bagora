import Link from "next/link";
import { button, container } from "@/components/ui/styles";

export default function NotFound() {
  return (
    <div className={`${container} max-w-xl py-28 text-center`}>
      <p className="text-xs uppercase tracking-[0.25em] text-cognac">404</p>
      <h1 className="mt-4 text-4xl text-espresso sm:text-5xl">Page not found</h1>
      <p className="mt-4 text-muted">The page you&apos;re looking for has moved or no longer exists.</p>
      <Link href="/shop" className={`${button.primary} mt-10`}>
        Browse the collection
      </Link>
    </div>
  );
}
