import { container } from "@/components/ui/styles";

/** Quiet skeleton shown while a page loads. */
export default function Loading() {
  return (
    <div className="bg-ivory">
      <div className={`${container} py-16`} aria-busy="true" aria-label="Loading">
        <div className="h-14 w-64 animate-pulse bg-ivory-deep" />
        <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[4/5] animate-pulse bg-ivory-deep" />
              <div className="mt-4 h-5 w-2/3 animate-pulse bg-ivory-deep" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
