"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

type AddItemInput = Omit<CartItem, "quantity"> & { quantity?: number };

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  badgeBump: number;
  openCart: () => void;
  closeCart: () => void;
  setOpen: (open: boolean) => void;
  addItem: (item: AddItemInput) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return sum + price * quantity;
  }, 0);
}

export function getCartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      badgeBump: 0,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setOpen: (open) => set({ isOpen: open }),
      addItem: (item) => {
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const price = Number(item.price) || 0;
        set((state) => {
          const existing = state.items.find(
            (entry) => entry.productId === item.productId,
          );
          const items = existing
            ? state.items.map((entry) =>
                entry.productId === item.productId
                  ? {
                      ...entry,
                      price,
                      quantity: (Number(entry.quantity) || 0) + quantity,
                    }
                  : entry,
              )
            : [
                ...state.items,
                {
                  productId: item.productId,
                  slug: item.slug,
                  name: item.name,
                  price,
                  image: item.image,
                  quantity,
                },
              ];

          return {
            items,
            isOpen: true,
            badgeBump: state.badgeBump + 1,
          };
        });
      },
      updateQuantity: (productId, quantity) => {
        const nextQuantity = Number(quantity) || 0;
        set((state) => ({
          items:
            nextQuantity <= 0
              ? state.items.filter((item) => item.productId !== productId)
              : state.items.map((item) =>
                  item.productId === productId
                    ? { ...item, quantity: nextQuantity }
                    : item,
                ),
        }));
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "cart",
      partialize: (state) => ({
        items: state.items,
      }),
    },
  ),
);
