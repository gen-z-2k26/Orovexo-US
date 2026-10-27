"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, ShoppingBag, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { QuantityPicker } from "@/components/QuantityPicker";
import { addProductToCart } from "@/lib/add-to-cart";
import { useCartStore } from "@/lib/cart-store";
import { useStore } from "@/lib/store-context";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductStatusBadges } from "@/components/ProductStatusBadges";
import { cn } from "@/lib/utils";

export function QuickViewModal({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings } = useStore();
  const setError = useCartStore((state) => state.setError);
  const [active, setActive] = useState<Product | null>(product);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    if (product) {
      setActive(product);
      setQuantity(1);
      setAdded(false);
      setWishlisted(false);
    }
  }, [product]);

  if (!active) return null;

  async function handleAdd() {
    if (!active?.inStock || busy) return;
    setBusy(true);
    try {
      await addProductToCart(active, quantity);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1200);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not add to cart.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[92dvh] overflow-hidden rounded-2xl border-0 bg-transparent p-0 shadow-lg sm:max-w-5xl"
      >
        <DialogTitle className="sr-only">{active.name}</DialogTitle>
        <DialogDescription className="sr-only">
          Quick view for {active.name}
        </DialogDescription>

        <div className="grid overflow-hidden rounded-2xl bg-muted text-foreground md:grid-cols-2">
          <div className="relative min-h-72 overflow-hidden md:min-h-[34rem]">
            <ProductImageCarousel
              images={active.images}
              alt={active.name}
              fallbackImage={settings.logo}
              rounded="rounded-none"
              className="absolute inset-0 size-full"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          <div className="relative flex flex-col gap-6 bg-card p-6 sm:p-8">
            <div className="flex justify-end">
              <button
                type="button"
                aria-label="Close quick view"
                onClick={() => onOpenChange(false)}
                className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-balance text-2xl leading-tight tracking-tight sm:text-3xl">
                {active.name}
              </h2>
              <p className="text-xl tabular-nums tracking-tight">
                {formatPrice(active.price, settings)}
              </p>
              <ProductStatusBadges product={active} />
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                {active.description}
              </p>
            </div>

            <div className="mt-auto space-y-3 pt-2">
              <div className="flex items-center gap-2.5">
                <QuantityPicker
                  value={quantity}
                  disabled={!active.inStock}
                  onChange={setQuantity}
                />

                <Button
                  type="button"
                  size="lg"
                  disabled={!active.inStock || busy}
                  onClick={() => void handleAdd()}
                  className="flex-1"
                >
                  <ShoppingBag className="size-4" />
                  {added ? "Added" : active.inStock ? "Add to cart" : "Unavailable"}
                </Button>

                <button
                  type="button"
                  aria-label={
                    wishlisted ? "Remove from wishlist" : "Add to wishlist"
                  }
                  aria-pressed={wishlisted}
                  onClick={() => setWishlisted((value) => !value)}
                  className={cn(
                    "inline-flex size-11 items-center justify-center rounded-xl border border-border bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    wishlisted
                      ? "text-destructive"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <Heart className={cn("size-5", wishlisted && "fill-current")} />
                </button>
              </div>

              <Link
                href={`/products/${active.slug}`}
                onClick={() => onOpenChange(false)}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-12 w-full",
                )}
              >
                See detail
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
