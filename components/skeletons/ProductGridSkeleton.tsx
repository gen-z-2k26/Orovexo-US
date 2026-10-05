import { Skeleton } from "@/components/ui/skeleton";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl border border-border bg-card"
        >
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
