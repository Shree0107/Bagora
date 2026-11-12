import { container } from "@/components/ui/styles";

/** Simple skeleton shown while a page loads. */
export default function Loading() {
  return (
    <div className={`${container} py-16`} aria-busy="true" aria-label="Loading">
      <div className="h-10 w-48 animate-pulse rounded bg-sand/60" />
      <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/5] animate-pulse rounded-sm bg-ivory" />
            <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-sand/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
