import { Skeleton } from "@/components/ui/skeleton";
import { pageContainer } from "@/lib/layout";

export function ProductDetailSkeleton() {
  return (
    <div
      className={pageContainer(
        "grid gap-8 py-10 sm:py-12 lg:grid-cols-2 lg:gap-12",
      )}
      aria-busy="true"
      aria-label="Loading product"
    >
      <Skeleton className="aspect-square w-full rounded-3xl" />
      <div className="space-y-4 lg:py-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-28 w-full rounded-3xl" />
      </div>
    </div>
  );
}
