import type { MotionLevel } from "@/lib/types";

export const durations = {
  fast: 0.2,
  base: 0.35,
  slow: 0.55,
} as const;

export const easings = {
  standard: [0.22, 1, 0.36, 1] as const,
  soft: [0.33, 1, 0.68, 1] as const,
  emphasized: [0.4, 0, 0.2, 1] as const,
};

export const motionByLevel = {
  none: {
    duration: 0,
    distance: 0,
    stagger: 0,
    scale: 1,
  },
  subtle: {
    duration: durations.base,
    distance: 12,
    stagger: 0.07,
    scale: 1.03,
  },
  expressive: {
    duration: durations.slow,
    distance: 28,
    stagger: 0.1,
    scale: 1.06,
  },
} as const;

export function resolveMotionLevel(
  level: MotionLevel | undefined,
  prefersReducedMotion: boolean,
): MotionLevel {
  if (prefersReducedMotion || !level) {
    return prefersReducedMotion ? "none" : (level ?? "subtle");
  }
  return level;
}

export function shouldAnimate(
  level: MotionLevel,
  prefersReducedMotion: boolean,
) {
  return resolveMotionLevel(level, prefersReducedMotion) !== "none";
}

export const hoverLiftClass =
  "motion-safe-only transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-md hover:border-primary/40";

export const imageZoomClass =
  "motion-safe-only transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]";
