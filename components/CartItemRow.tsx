"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { CartItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store-context";
import { useCartStore } from "@/lib/cart-store";
import { useMotionEnabled } from "@/lib/use-motion-enabled";
import { motionByLevel, easings } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { QuantityPicker } from "@/components/QuantityPicker";

export function CartItemRow({ item }: { item: CartItem }) {
  const { settings } = useStore();
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const { enabled, level } = useMotionEnabled();
  const motionTokens = motionByLevel[level];

  const content = (
    <div className="flex gap-3.5 rounded-2xl border border-border bg-card p-3.5">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatPrice(item.price, settings.currency, settings.locale)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => removeItem(item.productId)}
            aria-label={`Remove ${item.name} from cart`}
          >
            Remove
          </Button>
        </div>
        <div className="flex items-center gap-2.5">
          <QuantityPicker
            size="sm"
            value={item.quantity}
            aria-label={`Quantity for ${item.name}`}
            onChange={(next) => updateQuantity(item.productId, next)}
          />
          <p className="text-sm font-medium tabular-nums">
            {formatPrice(
              item.price * item.quantity,
              settings.currency,
              settings.locale,
            )}
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
