import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function salePercent(product: Product) {
  if (!product.onSale || product.regularPrice <= product.price) return 0;
  return Math.round(
    ((product.regularPrice - product.price) / product.regularPrice) * 100,
  );
}

export function ProductStatusBadges({
  product,
  className,
  overlay = false,
}: {
  product: Product;
  className?: string;
  overlay?: boolean;
}) {
  const percent = salePercent(product);

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {product.onSale ? (
        <Badge>
          {percent > 0 ? `Save ${percent}%` : "Sale"}
        </Badge>
      ) : null}
      {overlay && product.inStock ? null : (
        <Badge
          variant={product.inStock ? "outline" : "secondary"}
          className={
            overlay && !product.inStock
              ? "border-white/20 bg-black/65 text-white backdrop-blur-md"
              : undefined
          }
        >
          {product.inStock ? "In stock" : "Sold out"}
        </Badge>
      )}
    </div>
  );
}
