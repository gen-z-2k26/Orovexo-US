import { pageContainer } from "@/lib/layout";

export default function HomeLoading() {
  return (
    <div aria-busy="true" aria-label="Loading storefront">
      <div className="min-h-[78dvh] animate-pulse bg-muted" />
      <div className={pageContainer("space-y-8 py-14 sm:py-16")}>
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-3xl bg-muted"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
