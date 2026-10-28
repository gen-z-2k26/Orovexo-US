import { pageContainer } from "@/lib/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewsLoading() {
  return (
    <div className={pageContainer("py-10 sm:py-14")} aria-busy="true">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-6 h-12 w-2/3" />
      <Skeleton className="mt-10 h-48 w-full rounded-3xl" />
      <div className="mt-8 space-y-4">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
      </div>
    </div>
  );
}
