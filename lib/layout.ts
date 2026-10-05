import { cn } from "@/lib/utils";

/** Shared layout tokens for consistent page spacing. */
export const pageContainerClass =
  "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

export const sectionYClass = "py-14 sm:py-16 lg:py-20";

export const sectionStackClass = "space-y-8";

export function pageContainer(...classes: Array<string | undefined | false>) {
  return cn(pageContainerClass, ...classes);
}
