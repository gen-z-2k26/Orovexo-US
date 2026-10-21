import { Skeleton } from "@/components/ui/skeleton";
import { StoreLoader } from "@/components/StoreLoader";

export function ProductGridSkeleton({
  count = 8,
  showLoader = false,
}: {
  count?: number;
  showLoader?: boolean;
}) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading products">
      {showLoader ? <StoreLoader compact label="Loading products..." /> : null}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col rounded-[22px] border border-border/80 bg-card p-2.5"
          >
            <Skeleton className="aspect-[16/11] w-full rounded-2xl" />
            <div className="space-y-2.5 px-1.5 pt-3 pb-1">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-3 w-14 rounded-full" />
              </div>
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
