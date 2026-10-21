"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";
import { useMotionEnabled } from "@/lib/use-motion-enabled";

export function SmoothScroll({ children }: { children: ReactNode }) {
  const { enabled, prefersReducedMotion } = useMotionEnabled();

  if (!enabled || prefersReducedMotion) {
    return children;
  }

  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        duration: 1.15,
        lerp: 0.08,
        smoothWheel: true,
        anchors: true,
        syncTouch: false,
      }}
    >
      {children}
    </ReactLenis>
  );
}
