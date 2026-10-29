import { StoreLoader } from "@/components/StoreLoader";
import { ProductGridSkeleton } from "@/components/skeletons/ProductGridSkeleton";
import { getSiteSettings } from "@/lib/api";
import { pageContainer } from "@/lib/layout";

export default async function HomeLoading() {
  const settings = await getSiteSettings();

  return (
    <div aria-busy="true" aria-label="Loading storefront">
      <div className="relative flex min-h-[72dvh] items-center justify-center overflow-hidden border-b border-border bg-muted/40">
        <StoreLoader label={`Preparing ${settings.name}...`} />
      </div>
      <div className={pageContainer("space-y-8 py-14 sm:py-16")}>
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
        </div>
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}
