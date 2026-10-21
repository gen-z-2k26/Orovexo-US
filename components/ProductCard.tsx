"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, Eye, Plus, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store-context";
import { useCartStore } from "@/lib/cart-store";
import { useMotionEnabled } from "@/lib/use-motion-enabled";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { QuickViewModal } from "@/components/QuickViewModal";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { settings } = useStore();
  const addItem = useCartStore((state) => state.addItem);
  const { enabled } = useMotionEnabled();
  const [added, setAdded] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  const discountPercent =
    product.onSale && product.regularPrice > product.price
      ? Math.round(
          ((product.regularPrice - product.price) / product.regularPrice) * 100,
        )
      : 0;

  function handleAdd(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
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
    window.setTimeout(() => setAdded(false), 1400);
  }

  function handleQuickView(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setQuickOpen(true);
  }

  return (
    <>
      <article
        className={cn(
          "group relative flex flex-col rounded-[22px] border border-border/80 bg-card p-2.5",
          enabled &&
            "transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.55)]",
        )}
      >
        {/* Framed Media Stage */}
        <div className="relative overflow-hidden rounded-2xl bg-muted/60">
          <Link
            href={`/products/${product.slug}`}
            aria-label={`View ${product.name}`}
            className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          />

          <ProductImageCarousel
            images={product.images}
            alt={product.imageAlts[0] || product.name}
            fallbackImage={settings.logo}
            showOnHover
            rounded="rounded-2xl"
            className={cn(
              "relative z-[1] aspect-[16/11] pointer-events-none",
              !product.inStock && "opacity-75 saturate-50",
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* Top-left Status Pills */}
          <div className="pointer-events-none absolute top-2.5 left-2.5 z-20 flex flex-wrap items-center gap-1.5">
            {product.onSale ? (
              <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold tracking-tight text-primary-foreground shadow-sm">
                {discountPercent > 0 ? `Save ${discountPercent}%` : "Sale"}
              </span>
            ) : null}
            {!product.inStock ? (
              <span className="inline-flex items-center rounded-full border border-white/15 bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                Sold out
              </span>
            ) : null}
          </div>

          {/* Top-right Quick View Trigger */}
          <button
            type="button"
            onClick={handleQuickView}
            aria-label={`Quick view ${product.name}`}
            title="Quick view"
            className="
              absolute top-2.5 right-2.5 z-20 inline-flex size-8 items-center justify-center rounded-full
              border border-white/25 bg-black/50 text-white shadow-sm backdrop-blur-md
              transition-all duration-200 ease-out
              opacity-100 sm:scale-90 sm:opacity-0
              group-hover:scale-100 group-hover:opacity-100
              hover:bg-black/80
              focus-visible:scale-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
            "
          >
            <Eye className="size-3.5" />
          </button>
        </div>

        {/* Structured Info & Action Footer */}
        <div className="flex flex-1 flex-col justify-between gap-2.5 px-1.5 pt-3 pb-1">
          {/* Row 1: Category Eyebrow + Stock Indicator */}
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {product.category}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  product.inStock
                    ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                    : "bg-muted-foreground/40",
                )}
              />
              {product.inStock ? "In stock" : "Out of stock"}
            </span>
          </div>

          {/* Row 2: Product Title */}
          <Link
            href={`/products/${product.slug}`}
            title={product.name}
            className="group/title flex items-center justify-between gap-1.5 focus-visible:outline-none"
          >
            <h3 className="truncate font-display text-[16px] font-semibold tracking-tight text-foreground transition-colors group-hover/title:text-primary">
              {product.name}
            </h3>
            <ArrowUpRight className="size-3.5 shrink-0 -translate-x-1 translate-y-0.5 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 group-hover/title:text-primary" />
          </Link>

          {/* Row 3: Price Stack (Left) + Aligned Hover CTA Slot (Right) */}
          <div className="mt-0.5 flex items-center justify-between gap-3 border-t border-border/60 pt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-base font-bold tabular-nums tracking-tight text-foreground sm:text-[17px]">
                {formatPrice(product.price, settings.currency, settings.locale)}
              </span>
              {product.onSale && product.regularPrice > product.price ? (
                <span className="text-xs font-medium tabular-nums text-muted-foreground line-through">
                  {formatPrice(
                    product.regularPrice,
                    settings.currency,
                    settings.locale,
                  )}
                </span>
              ) : null}
            </div>

            {/* Primary Add to Cart CTA: Compact icon on rest (desktop), expands into full pill on card hover */}
            <button
              type="button"
              disabled={!product.inStock}
              onClick={handleAdd}
              aria-label={
                product.inStock
                  ? `Add ${product.name} to cart`
                  : `${product.name} is out of stock`
              }
              className={cn(
                "relative z-20 inline-flex h-9 shrink-0 items-center justify-center rounded-xl font-semibold text-xs tracking-wide transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                added
                  ? "bg-emerald-500 px-3.5 text-white shadow-sm"
                  : product.inStock
                    ? "bg-primary px-3.5 text-primary-foreground shadow-xs hover:brightness-105 active:scale-[0.97] sm:translate-y-1 sm:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100"
                    : "cursor-not-allowed bg-muted px-3 text-muted-foreground sm:opacity-0 group-hover:opacity-100",
              )}
            >
              {added ? (
                <span className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 stroke-[2.5]" />
                  <span>Added</span>
                </span>
              ) : product.inStock ? (
                <span className="inline-flex items-center gap-1.5">
                  <ShoppingBag className="size-3.5" />
                  <span>Add to cart</span>
                  <Plus className="size-3 opacity-75" />
                </span>
              ) : (
                <span>Unavailable</span>
              )}
            </button>
          </div>
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
