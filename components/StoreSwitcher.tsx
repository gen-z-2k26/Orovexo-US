"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DEMO_STORE_COOKIE } from "@/lib/demo-cookie";
import { cn } from "@/lib/utils";
import { durations } from "@/lib/motion";

type StoreOption = {
  id: string;
  name: string;
  logo: string;
};

export function StoreSwitcher({
  stores,
  currentStoreId,
}: {
  stores: StoreOption[];
  currentStoreId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fading, setFading] = useState(false);

  function switchStore(storeId: string) {
    if (storeId === currentStoreId || pending) return;

    setFading(true);
    document.cookie = `${DEMO_STORE_COOKIE}=${storeId}; path=/; max-age=31536000; samesite=lax`;

    window.setTimeout(() => {
      startTransition(() => {
        router.refresh();
        setFading(false);
      });
    }, Math.min(durations.fast, 0.2) * 1000);
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-background p-5 transition-opacity sm:p-6",
        fading && "opacity-0",
      )}
      style={{ transitionDuration: `${Math.min(durations.fast, 0.2)}s` }}
    >
      <div className="mb-4 space-y-1">
        <p className="text-sm font-medium">Demo store switcher</p>
        <p className="text-pretty text-xs text-muted-foreground">
          Switch stores live. Theme, logo, catalog, and homepage stay separate.
        </p>
      </div>
      <div
        className="flex flex-wrap gap-2.5"
        role="group"
        aria-label="Switch demo store"
      >
        {stores.map((store) => {
          const active = store.id === currentStoreId;
          return (
            <button
              key={store.id}
              type="button"
              disabled={pending}
              onClick={() => switchStore(store.id)}
              className={cn(
                "inline-flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted",
              )}
              aria-pressed={active}
            >
              <Image
                src={store.logo}
                alt=""
                width={20}
                height={20}
                className="size-5 rounded-md"
              />
              <span>{store.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
