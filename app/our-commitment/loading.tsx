import { pageContainer } from "@/lib/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function FaqLoading() {
  return (
    <div className={pageContainer("py-10 sm:py-14")} aria-busy="true">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-6 h-12 w-2/3" />
      <div className="mt-10 space-y-3">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  );
}
