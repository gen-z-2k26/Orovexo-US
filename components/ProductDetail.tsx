"use client";

import { useState } from "react";
import { Check, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import type {
  BnplPublicConfig,
  Product,
  ProductPaymentDisplay,
} from "@/lib/types";
import { defaultProductPage } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store-context";
import { addProductToCart, shopNowToCheckout } from "@/lib/add-to-cart";
import { useCartStore } from "@/lib/cart-store";
import { ProductStatusBadges, salePercent } from "@/components/ProductStatusBadges";
import { ProductRatingRow } from "@/components/ProductRatingRow";
import { SecurePaymentsBlock } from "@/components/SecurePaymentsBlock";
import { BnplMessaging } from "@/components/BnplMessaging";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { QuantityPicker } from "@/components/QuantityPicker";
import { pageContainer } from "@/lib/layout";
import { cn } from "@/lib/utils";

export function ProductDetail({
  product,
  payment,
  bnpl,
}: {
  product: Product;
  payment: ProductPaymentDisplay;
  bnpl: BnplPublicConfig;
}) {
  const { settings } = useStore();
  const setError = useCartStore((state) => state.setError);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const page = settings.productPage ?? defaultProductPage;
  const percent = salePercent(product);

  async function handleAdd() {
    if (!product.inStock || busy) return;
    setBusy(true);
    try {
      await addProductToCart(product, quantity);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1200);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not add to cart.");
    } finally {
      setBusy(false);
    }
  }

  async function handleShopNow() {
    if (!product.inStock || busy) return;
    setBusy(true);
    try {
      await shopNowToCheckout(product, quantity, page.shopNowEmptyCart);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not start checkout.",
      );
    } finally {
      setBusy(false);
    }
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
          <div className="flex flex-wrap items-center gap-3">
            {product.onSale && product.regularPrice > product.price ? (
              <p className="text-lg tabular-nums text-muted-foreground line-through">
                {formatPrice(product.regularPrice, settings)}
              </p>
            ) : null}
            <p className="text-2xl tabular-nums tracking-tight">
              {formatPrice(product.price, settings)}
            </p>
            {percent > 0 ? <Badge>Save {percent}%</Badge> : null}
          </div>
          {page.enableRatingRow ? <ProductRatingRow product={product} /> : null}
          <BnplMessaging
            product={product}
            settings={settings}
            config={bnpl}
            affirmEnabled={payment.affirmEnabled}
            afterpayEnabled={payment.afterpayEnabled}
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {product.inStock ? (
              <>
                <Check className="size-4 text-emerald-600" aria-hidden />
                In stock · Ready to ship
              </>
            ) : (
              <ProductStatusBadges product={product} />
            )}
          </div>
        </div>

        <p className="max-w-prose text-pretty text-base leading-relaxed text-muted-foreground">
          {product.description}
        </p>

        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Truck className="size-4 text-emerald-600" aria-hidden />
              Free shipping on eligible orders
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <RefreshCcw className="size-4" aria-hidden />
              30-day easy returns
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="size-4" aria-hidden />
              Secure checkout
            </li>
          </ul>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <QuantityPicker
              id="quantity"
              value={quantity}
              disabled={!product.inStock}
              onChange={setQuantity}
            />
          </div>

          {page.enableShopNow && product.inStock ? (
            <Button
              type="button"
              size="lg"
              className={cn(
                "ppx-shop-now w-full",
                "[--ppx-btn-bg:var(--foreground)] [--ppx-btn-color:var(--background)]",
              )}
              disabled={busy}
              onClick={() => void handleShopNow()}
            >
              {busy
                ? "Working..."
                : `${page.shopNowLabel || "Buy Now"} · ${formatPrice(product.price, settings)}`}
            </Button>
          ) : null}

          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full"
            disabled={!product.inStock || busy}
            onClick={() => void handleAdd()}
          >
            {added ? "Added" : busy ? "Adding..." : "Add to cart"}
          </Button>

          {page.enableSecureBlock ? (
            <SecurePaymentsBlock icons={payment.icons} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
