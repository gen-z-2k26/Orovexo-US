import { ProductGridSkeleton } from "@/components/skeletons/ProductGridSkeleton";
import { pageContainer } from "@/lib/layout";

export default function CollectionLoading() {
  return (
    <div className={pageContainer("space-y-8 py-10 sm:py-12")}>
      <div className="space-y-3 border-b border-border pb-8">
        <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-72 max-w-full animate-pulse rounded-md bg-muted" />
      </div>
      <ProductGridSkeleton showLoader />
    </div>
  );
}
