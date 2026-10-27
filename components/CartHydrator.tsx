"use client";

import { useEffect } from "react";
import { getCartAction, migrateLegacyCartAction } from "@/app/actions/cart";
import { useCartStore } from "@/lib/cart-store";

type LegacyPersist = {
  state?: { items?: Array<{ productId?: string; quantity?: number }> };
};

function readLegacyItems() {
  try {
    const raw = window.localStorage.getItem("cart");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LegacyPersist;
    return (parsed.state?.items ?? [])
      .map((item) => ({
        productId: String(item.productId || ""),
        quantity: Number(item.quantity) || 1,
      }))
      .filter((item) => item.productId);
  } catch {
    return [];
  }
}

export function CartHydrator() {
  const setCart = useCartStore((state) => state.setCart);
  const setHydrated = useCartStore((state) => state.setHydrated);
  const setError = useCartStore((state) => state.setError);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const legacy = readLegacyItems();
        const cart = legacy.length
          ? await migrateLegacyCartAction(legacy)
          : await getCartAction();
        if (cancelled) return;
        setCart(cart);
        if (legacy.length) window.localStorage.removeItem("cart");
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error ? error.message : "Could not load your cart.",
          );
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setCart, setError, setHydrated]);

  return null;
}
