import pagesJson from "@/data/trust/pages.json";
import type { CarePage } from "@/lib/customer-care";

const PAGES = pagesJson.pages as CarePage[];

export function trustPages() {
  return PAGES;
}

export function trustBySlug(slug: string) {
  return PAGES.find((page) => page.slug === slug) ?? null;
}

export type CareLayout = "policy" | "notice" | "accessibility";

export function layoutForTrustSlug(slug: string): CareLayout {
  if (slug === "legal-notice") return "notice";
  if (slug === "accessibility-statement") return "accessibility";
  return "policy";
}
