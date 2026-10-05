"use client";

import { useEffect, useState } from "react";
import { shouldAnimate } from "@/lib/motion";
import { useStore } from "@/lib/store-context";

export function useMotionEnabled() {
  const { settings } = useStore();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const level = settings.theme.motion ?? "subtle";
  const enabled = shouldAnimate(level, prefersReducedMotion);

  return {
    enabled,
    level: enabled ? level : ("none" as const),
    prefersReducedMotion,
  };
}
