"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { StoreSettings } from "@/lib/types";

type StoreContextValue = {
  settings: StoreSettings;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  settings,
  children,
}: {
  settings: StoreSettings;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ settings }), [settings]);

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
