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
      <Skeleton className="h-4 w-64" />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex gap-3">
          <div className="hidden w-[76px] flex-col gap-2 sm:flex">
            <Skeleton className="aspect-square w-full rounded-none" />
            <Skeleton className="aspect-square w-full rounded-none" />
            <Skeleton className="aspect-square w-full rounded-none" />
          </div>
          <Skeleton className="aspect-square min-w-0 flex-1 rounded-none" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-11 w-72" />
        </div>
      </div>
    </div>
  );
}
