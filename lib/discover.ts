import pagesJson from "@/data/discover/pages.json";
import type { CarePage } from "@/lib/customer-care";

const PAGES = pagesJson.pages as CarePage[];

export function discoverBySlug(slug: string) {
  return PAGES.find((page) => page.slug === slug) ?? null;
}
