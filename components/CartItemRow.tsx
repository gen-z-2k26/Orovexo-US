"use client";

import { StoreImage } from "@/components/StoreImage";
import { motion } from "motion/react";
import type { StoreCartItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store-context";
import { useCartStore } from "@/lib/cart-store";
import { useMotionEnabled } from "@/lib/use-motion-enabled";
import { motionByLevel, easings } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { QuantityPicker } from "@/components/QuantityPicker";
import {
  removeCartItemAction,
  updateCartItemAction,
} from "@/app/actions/cart";
import { toast } from "@/lib/toast-store";

export function CartItemRow({ item }: { item: StoreCartItem }) {
  const { settings } = useStore();
  const setCart = useCartStore((state) => state.setCart);
  const setError = useCartStore((state) => state.setError);
  const { enabled, level } = useMotionEnabled();
  const motionTokens = motionByLevel[level];

  async function changeQty(next: number) {
    try {
      const cart = await updateCartItemAction({ key: item.key, quantity: next });
      setCart(cart);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update quantity.";
      setError(message);
      toast({ title: "Could not update quantity", description: message, variant: "error" });
    }
  }

  async function remove() {
    try {
      const cart = await removeCartItemAction(item.key);
      setCart(cart);
      toast({ title: "Removed from cart", description: item.name });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not remove item.";
      setError(message);
      toast({ title: "Could not remove item", description: message, variant: "error" });
    }
  }

  const content = (
    <div className="flex gap-3.5 rounded-2xl border border-border bg-card p-3.5">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
        <StoreImage src={item.image} alt={item.name} sizes="80px" />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatPrice(item.price, settings)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => void remove()}
            aria-label={`Remove ${item.name} from cart`}
          >
            Remove
          </Button>
        </div>
        <div className="flex items-center gap-2.5">
          <QuantityPicker
            size="sm"
            value={item.quantity}
            min={item.quantityMin}
            max={item.quantityMax}
            aria-label={`Quantity for ${item.name}`}
            onChange={(next) => void changeQty(next)}
          />
          <p className="text-sm font-medium tabular-nums">
            {formatPrice(item.price * item.quantity, settings)}
          </p>
        </div>
      </div>
    </div>
  );

  if (!enabled) {
    return content;
  }

  return (
    <motion.div
      layout={false}
      initial={{ opacity: 0, y: motionTokens.distance * 0.4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: Math.min(motionTokens.duration, 0.2),
        ease: easings.standard,
      }}
    >
      {content}
    </motion.div>
  );
}
