import { cn } from "@/lib/utils";

/** Shared layout tokens for consistent page spacing. */
export const pageContainerClass =
  "mx-auto w-full max-w-[var(--content-width)] px-[var(--page-gutter)]";

export const narrowContainerClass =
  "mx-auto w-full max-w-[var(--content-narrow)] px-[var(--page-gutter)]";

export const sectionYClass = "py-[var(--section-y)]";

export const sectionStackClass = "space-y-[var(--section-gap)]";

export function pageContainer(...classes: Array<string | undefined | false>) {
  return cn(pageContainerClass, ...classes);
}

export function narrowContainer(...classes: Array<string | undefined | false>) {
  return cn(narrowContainerClass, ...classes);
}
