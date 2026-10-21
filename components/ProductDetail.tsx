"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store-context";
import { useCartStore } from "@/lib/cart-store";
import { Badge } from "@/components/ui/badge";
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
        rounded="rounded-3xl"
        className="aspect-square border border-border"
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority
      />

      <div className="flex flex-col gap-6 lg:py-2">
        <div className="space-y-4">
          <p className="text-sm font-medium text-primary">
            {settings.name} · {product.category}
          </p>
          <h1 className="font-display text-balance text-3xl font-semibold sm:text-5xl">
            {product.name}
          </h1>
          <div className="flex flex-wrap items-baseline gap-3">
            <p className="text-2xl font-semibold tabular-nums">
              {formatPrice(product.price, settings.currency, settings.locale)}
            </p>
            {product.onSale && product.regularPrice > product.price ? (
              <p className="text-lg tabular-nums text-muted-foreground line-through">
                {formatPrice(
                  product.regularPrice,
                  settings.currency,
                  settings.locale,
                )}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {product.onSale ? (
              <Badge className="rounded-full bg-accent text-accent-foreground">
                Sale
              </Badge>
            ) : null}
            <Badge
              variant={product.inStock ? "default" : "secondary"}
              className="rounded-full"
            >
              {product.inStock ? "In stock" : "Out of stock"}
            </Badge>
          </div>
        </div>

        <p className="max-w-prose text-pretty text-base leading-relaxed text-muted-foreground">
          {product.description}
        </p>

        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:flex-row sm:items-end">
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
            className="rounded-2xl sm:min-w-56"
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
