"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store-context";
import { useCartStore } from "@/lib/cart-store";
import { ProductStatusBadges } from "@/components/ProductStatusBadges";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { QuantityPicker } from "@/components/QuantityPicker";
import { pageContainer } from "@/lib/layout";

export function ProductDetail({ product }: { product: Product }) {
  const { settings } = useStore();
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (!product.inStock) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? settings.logo,
      quantity,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div
      className={pageContainer(
        "grid gap-8 py-10 sm:py-12 lg:grid-cols-2 lg:gap-12 lg:py-14",
      )}
    >
      <ProductImageCarousel
        images={product.images}
        alt={product.imageAlts[0] || product.name}
        fallbackImage={settings.logo}
        rounded="rounded-2xl"
        className="aspect-square border border-border shadow-sm"
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority
      />

      <div className="flex flex-col gap-6 lg:py-2">
        <div className="space-y-4">
          <p className="text-sm font-medium text-primary">
            {product.category
              ? `${settings.name} · ${product.category}`
              : settings.name}
          </p>
          <h1 className="font-display text-balance text-3xl sm:text-5xl">
            {product.name}
          </h1>
          <div className="flex flex-wrap items-baseline gap-3">
            <p className="text-2xl tabular-nums tracking-tight">
              {formatPrice(product.price, settings)}
            </p>
            {product.onSale && product.regularPrice > product.price ? (
              <p className="text-lg tabular-nums text-muted-foreground line-through">
                {formatPrice(product.regularPrice, settings)}
              </p>
            ) : null}
          </div>
          <ProductStatusBadges product={product} />
        </div>

        <p className="max-w-prose text-pretty text-base leading-relaxed text-muted-foreground">
          {product.description}
        </p>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <QuantityPicker
              id="quantity"
              value={quantity}
              disabled={!product.inStock}
              onChange={setQuantity}
            />
          </div>
          <Button
            type="button"
            size="lg"
            className="sm:min-w-56"
            disabled={!product.inStock}
            onClick={handleAdd}
          >
            {added ? "Added" : "Add to cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
