import { Skeleton } from "@/components/ui/skeleton";
import { StoreLoader } from "@/components/StoreLoader";
import { pageContainer } from "@/lib/layout";

export function ProductDetailSkeleton() {
  return (
    <div
      className={pageContainer("space-y-6 py-10 sm:py-12")}
      aria-busy="true"
      aria-label="Loading product"
    >
      <StoreLoader compact label="Loading product details..." />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-4 lg:py-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
