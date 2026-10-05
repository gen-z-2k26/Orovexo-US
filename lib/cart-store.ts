"use client";

import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { createOrder } from "@/lib/api";
import type { CartItem, CheckoutPayload, CreateOrderResult } from "@/lib/types";

type AddItemInput = Omit<CartItem, "quantity"> & { quantity?: number };

type CartState = {
  storeId: string;
  items: CartItem[];
  isOpen: boolean;
  badgeBump: number;
  setStoreId: (storeId: string) => void;
  openCart: () => void;
  closeCart: () => void;
  setOpen: (open: boolean) => void;
  addItem: (item: AddItemInput) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  placeOrder: (
    payload: Omit<CheckoutPayload, "items">,
  ) => Promise<CreateOrderResult>;
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

function normalizeItems(items: CartItem[]): CartItem[] {
  return items.map((item) => ({
    ...item,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 0,
  }));
}

let activeStoreId = "";

function storageKey(storeId: string) {
  return `cart-${storeId || "default"}`;
}

function readPersistedItems(storeId: string): CartItem[] {
  if (typeof window === "undefined" || !storeId) return [];
  try {
    const raw = window.localStorage.getItem(storageKey(storeId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as
      | { state?: { items?: CartItem[] } }
      | CartItem[];
    if (Array.isArray(parsed)) return normalizeItems(parsed);
    return normalizeItems(parsed.state?.items ?? []);
  } catch {
    return [];
  }
}

const cartStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined" || !activeStoreId) return null;
    return window.localStorage.getItem(storageKey(activeStoreId) || name);
  },
  setItem: (_name: string, value: string): void => {
    if (typeof window === "undefined" || !activeStoreId) return;
    window.localStorage.setItem(storageKey(activeStoreId), value);
  },
  removeItem: (_name: string): void => {
    if (typeof window === "undefined" || !activeStoreId) return;
    window.localStorage.removeItem(storageKey(activeStoreId));
  },
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      storeId: "",
      items: [],
      isOpen: false,
      badgeBump: 0,
      setStoreId: (storeId) => {
        const current = get().storeId;
        if (current === storeId) return;
        activeStoreId = storeId;
        set({
          storeId,
          items: readPersistedItems(storeId),
          isOpen: false,
        });
      },
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
      placeOrder: async (payload) => {
        const { storeId, items } = get();
        if (!storeId) {
          throw new Error("Cart is not bound to a store.");
        }
        const result = await createOrder(storeId, {
          ...payload,
          items,
        });
        set({ items: [] });
        return result;
      },
    }),
    {
      name: "cart-default",
      storage: createJSONStorage(() => cartStorage),
      partialize: (state) => ({
        items: state.items,
        storeId: state.storeId,
      }),
    },
  ),
);
