"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { CartItemRow } from "@/components/CartItemRow";
import { CheckoutModal } from "@/components/CheckoutModal";
import { getCartSubtotal, useCartStore } from "@/lib/cart-store";
import { useStore } from "@/lib/store-context";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const { settings } = useStore();
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const setOpen = useCartStore((state) => state.setOpen);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const subtotal = getCartSubtotal(items);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          data-lenis-prevent
          className="flex w-full flex-col gap-0 overflow-y-auto overscroll-contain sm:max-w-md"
        >
          <SheetHeader className="space-y-1.5">
            <SheetTitle>Your cart</SheetTitle>
            <SheetDescription>
              Review items before checkout. Carts are saved per store.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-2">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                <p className="font-medium">Your cart is empty</p>
                <p className="mt-2 text-pretty text-sm text-muted-foreground">
                  Add a product to get started.
                </p>
                <Link
                  href="/products"
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-5 rounded-2xl",
                  )}
                >
                  Browse products
                </Link>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <CartItemRow key={item.productId} item={item} />
                ))}
              </AnimatePresence>
            )}
          </div>

          <SheetFooter className="gap-3 border-t border-border">
            <div className="flex w-full items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-base font-semibold tabular-nums">
                {formatPrice(subtotal, settings.currency, settings.locale)}
              </span>
            </div>
            <Button
              type="button"
              size="lg"
              className="rounded-2xl"
              disabled={items.length === 0}
              onClick={() => {
                setOpen(false);
                setCheckoutOpen(true);
              }}
            >
              Checkout
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <CheckoutModal open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
