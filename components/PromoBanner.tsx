"use client";

import { useStore } from "@/lib/store-context";
import { pageContainer } from "@/lib/layout";

export function PromoBanner() {
  const { settings } = useStore();
  if (!settings.promoBanner) return null;

  return (
    <div className="bg-primary text-primary-foreground">
      <div
        className={pageContainer(
          "flex items-center justify-center py-2.5 text-center text-sm tracking-wide sm:text-base",
        )}
      >
        <p className="motion-safe-only animate-[marquee_18s_linear_infinite] sm:animate-none">
          {settings.promoBanner}
        </p>
      </div>
    </div>
  );
}
