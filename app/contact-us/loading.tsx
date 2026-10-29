import { pageContainer } from "@/lib/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContactLoading() {
  return (
    <div className={pageContainer("py-10 sm:py-14")} aria-busy="true">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-6 h-12 w-2/3" />
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}
