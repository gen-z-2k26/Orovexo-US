import { pageContainer } from "@/lib/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function AboutLoading() {
  return (
    <div className={pageContainer("py-10 sm:py-14")} aria-busy="true">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-6 h-12 w-2/3" />
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-11 w-40" />
        </div>
      </div>
    </div>
  );
}
