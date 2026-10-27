"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emptyStoreCart } from "@/lib/api/map-cart";
import type { StoreCart, StoreCartItem } from "@/lib/types";

type CartState = {
  cart: StoreCart;
  isOpen: boolean;
  badgeBump: number;
  error: string;
  hydrated: boolean;
  openCart: () => void;
  closeCart: () => void;
  setOpen: (open: boolean) => void;
  setCart: (cart: StoreCart, options?: { open?: boolean; bump?: boolean }) => void;
  setError: (error: string) => void;
  setHydrated: (hydrated: boolean) => void;
};

export function getCartCount(items: StoreCartItem[]) {
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: emptyStoreCart(),
      isOpen: false,
      badgeBump: 0,
      error: "",
      hydrated: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setOpen: (open) => set({ isOpen: open }),
      setError: (error) => set({ error }),
      setHydrated: (hydrated) => set({ hydrated }),
      setCart: (cart, options) =>
        set((state) => ({
          cart,
          error: "",
          isOpen: options?.open ? true : state.isOpen,
          badgeBump: options?.bump ? state.badgeBump + 1 : state.badgeBump,
        })),
    }),
    {
      name: "woo-cart",
      partialize: (state) => ({
        cart: state.cart,
      }),
    },
  ),
);
