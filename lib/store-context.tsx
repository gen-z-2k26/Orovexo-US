"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type { StoreSettings } from "@/lib/types";
import { useCartStore } from "@/lib/cart-store";

type StoreContextValue = {
  settings: StoreSettings;
  storeId: string;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  settings,
  children,
}: {
  settings: StoreSettings;
  children: ReactNode;
}) {
  const setStoreId = useCartStore((state) => state.setStoreId);

  useEffect(() => {
    setStoreId(settings.id);
  }, [settings.id, setStoreId]);

  const value = useMemo(
    () => ({
      settings,
      storeId: settings.id,
    }),
    [settings],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within StoreProvider.");
  }
  return context;
}
