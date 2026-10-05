import type { MotionLevel } from "@/lib/types";

export const durations = {
  fast: 0.18,
  base: 0.28,
  slow: 0.45,
} as const;

export const easings = {
  standard: [0.22, 1, 0.36, 1] as const,
  soft: [0.33, 1, 0.68, 1] as const,
};

export const motionByLevel = {
  none: {
    duration: 0,
    distance: 0,
    stagger: 0,
  },
  subtle: {
    duration: durations.base,
    distance: 12,
    stagger: 0.06,
  },
  expressive: {
    duration: durations.slow,
    distance: 20,
    stagger: 0.1,
  },
} as const;

export function resolveMotionLevel(
  level: MotionLevel | undefined,
  prefersReducedMotion: boolean,
): MotionLevel {
  if (prefersReducedMotion || !level) {
    return prefersReducedMotion ? "none" : level ?? "subtle";
  }
  return level;
}

export function shouldAnimate(level: MotionLevel, prefersReducedMotion: boolean) {
  return resolveMotionLevel(level, prefersReducedMotion) !== "none";
}
