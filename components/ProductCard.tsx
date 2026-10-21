"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store-context";
import { useCartStore } from "@/lib/cart-store";
import { useMotionEnabled } from "@/lib/use-motion-enabled";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { QuickViewModal } from "@/components/QuickViewModal";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { settings } = useStore();
  const addItem = useCartStore((state) => state.addItem);
  const { enabled } = useMotionEnabled();
  const [added, setAdded] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  function handleAdd() {
    if (!product.inStock) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? settings.logo,
      quantity: 1,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <>
      <article
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card",
          enabled &&
            "transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md",
        )}
      >
        <div className="relative">
          <Link
            href={`/products/${product.slug}`}
            aria-label={`View ${product.name}`}
            className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <ProductImageCarousel
            images={product.images}
            alt={product.imageAlts[0] || product.name}
            fallbackImage={settings.logo}
            showOnHover
            rounded="rounded-none"
            className="relative z-[1] aspect-square"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
            {product.onSale ? (
              <Badge className="rounded-full bg-accent text-accent-foreground">
                Sale
              </Badge>
            ) : null}
            {!product.inStock ? (
              <Badge className="rounded-full" variant="secondary">
                Out of stock
              </Badge>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setQuickOpen(true)}
            className="absolute bottom-3 right-3 z-20 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Quick view
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {settings.name} · {product.category}
            </p>
            <Link
              href={`/products/${product.slug}`}
              className="relative z-10 line-clamp-2 min-h-12 text-base font-semibold leading-snug text-balance hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {product.name}
            </Link>
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-base font-semibold tabular-nums">
                {formatPrice(product.price, settings.currency, settings.locale)}
              </p>
              {product.onSale && product.regularPrice > product.price ? (
                <p className="text-sm tabular-nums text-muted-foreground line-through">
                  {formatPrice(
                    product.regularPrice,
                    settings.currency,
                    settings.locale,
                  )}
                </p>
              ) : null}
            </div>
          </div>

          <Button
            type="button"
            className="relative z-10 mt-auto w-full rounded-2xl"
            disabled={!product.inStock}
            onClick={handleAdd}
            aria-label={
              product.inStock
                ? `Add ${product.name} to cart`
                : `${product.name} is out of stock`
            }
          >
            {added
              ? "Added"
              : product.inStock
                ? "Add to cart"
                : "Unavailable"}
          </Button>
        </div>
      </article>

      <QuickViewModal
        product={product}
        open={quickOpen}
        onOpenChange={setQuickOpen}
      />
    </>
  );
}
