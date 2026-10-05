import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-lg flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-balance text-4xl font-semibold">Page not found</h1>
      <p className="text-pretty text-muted-foreground">
        That page or product is not available in this store.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <Link href="/" className={cn(buttonVariants(), "rounded-2xl")}>
          Back home
        </Link>
        <Link
          href="/products"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
        >
          Browse shop
        </Link>
      </div>
    </div>
  );
}
