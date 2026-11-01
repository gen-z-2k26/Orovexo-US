import type { FooterColumn, NavLink } from "@/lib/types";
import { getWooOrigin, WOO_TIMEOUT_MS } from "@/lib/api/client";
import { toStorefrontHref } from "@/lib/site-urls";

/**
 * Block-theme navigations to create in WP Admin → Appearance → Editor → Navigation.
 * Classic Appearance → Menus is hidden on block themes.
 */
export const FOOTER_MENU_SLUGS = [
  "footer-discover",
  "footer-customer-care",
  "footer-trust",
] as const;

const SLUG_ALIASES: Record<string, string> = {
  "discover-orvexo": "footer-discover",
  discover: "footer-discover",
  "customer-care": "footer-customer-care",
  "footer-care": "footer-customer-care",
  "trust-transparency": "footer-trust",
  "footer-legal": "footer-trust",
};

type WpMenu = {
  id?: number;
  name?: string;
  slug?: string;
};

type WpMenuItem = {
  id?: number;
  title?: { rendered?: string } | string;
  url?: string;
  menus?: number;
  parent?: number;
  menu_order?: number;
};

type WpNavigation = {
  slug?: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  status?: string;
};

function decodeTitle(value: WpMenuItem["title"] | string | undefined): string {
  const raw = typeof value === "string" ? value : (value?.rendered ?? "");
  return raw
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

function canonicalizeSlug(slug: string) {
  const lower = slug.toLowerCase();
  return SLUG_ALIASES[lower] ?? lower;
}

function slotForNav(slug: string, title: string): string | null {
  const canonical = canonicalizeSlug(slug);
  if ((FOOTER_MENU_SLUGS as readonly string[]).includes(canonical)) {
    return canonical;
  }
  const hay = `${slug} ${title}`.toLowerCase();
  if (hay.includes("discover")) return "footer-discover";
  if (hay.includes("customer") || hay.includes("care")) {
    return "footer-customer-care";
  }
  if (
    hay.includes("trust") ||
    hay.includes("transparency") ||
    hay.includes("legal")
  ) {
    return "footer-trust";
  }
  return null;
}

async function wpJson<T>(path: string): Promise<T | null> {
  const origin = getWooOrigin();
  if (!origin) return null;
  try {
    const response = await fetch(`${origin}/wp-json/${path}`, {
      next: {
        revalidate: path.startsWith("orvexo/v1/footer") ? 0 : 60,
        tags: ["wp-menus"],
      },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(WOO_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function itemsForMenu(
  items: WpMenuItem[],
  menuId: number,
  wpOrigin: string,
): NavLink[] {
  return items
    .filter((item) => item.menus === menuId && !item.parent)
    .sort((a, b) => (a.menu_order ?? 0) - (b.menu_order ?? 0))
    .map((item) => ({
      label: decodeTitle(item.title),
      href: toStorefrontHref(item.url ?? "/", wpOrigin),
    }))
    .filter((link) => link.label && link.href);
}

function linksFromHtml(html: string, wpOrigin: string): NavLink[] {
  const links: NavLink[] = [];
  const seen = new Set<string>();
  const pattern = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const href = toStorefrontHref(match[1], wpOrigin);
    const label = decodeTitle(match[2]);
    if (!href || !label) continue;
    const key = `${label}:${href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ label, href });
  }
  return links;
}

type OrvexoFooterPayload = {
  columns?: Array<{
    slug?: string;
    title?: string;
    links?: Array<{ label?: string; href?: string }>;
  }>;
};

function columnsFromPlugin(
  payload: OrvexoFooterPayload | null,
  fallback: FooterColumn[],
  origin: string,
): FooterColumn[] | null {
  if (!payload?.columns?.length) return null;

  const bySlug = new Map<string, FooterColumn>();
  for (const column of payload.columns) {
    const slug = canonicalizeSlug(column.slug || "");
    const links = (column.links ?? [])
      .map((link) => ({
        label: (link.label || "").trim(),
        href: toStorefrontHref(link.href || "/", origin),
      }))
      .filter((link) => link.label && link.href);
    bySlug.set(slug, {
      title: column.title?.trim() || slug,
      slug,
      links,
    });
  }

  const hasLinks = FOOTER_MENU_SLUGS.some(
    (slug) => (bySlug.get(slug)?.links.length ?? 0) > 0,
  );
  if (!hasLinks) return null;

  return FOOTER_MENU_SLUGS.map((slug, index) => {
    const live = bySlug.get(slug);
    if (live) return live;
    return fallback[index];
  }).filter(Boolean) as FooterColumn[];
}

/**
 * Footer columns from WordPress, in order:
 * 1. orvexo/v1/footer (plugin: Appearance → Menus)
 * 2. Classic wp/v2 menus if public
 * 3. Block navigations (Appearance → Editor → Navigation)
 * Page bodies stay in Next JSON, not wp/v2/pages.
 */
export async function fetchWpFooterColumns(
  fallback: FooterColumn[],
): Promise<FooterColumn[] | null> {
  const origin = getWooOrigin();
  if (!origin) return null;

  const [pluginFooter, menus, items, navigations] = await Promise.all([
    wpJson<OrvexoFooterPayload>("orvexo/v1/footer"),
    wpJson<WpMenu[]>("wp/v2/menus?per_page=20"),
    wpJson<WpMenuItem[]>("wp/v2/menu-items?per_page=100"),
    wpJson<WpNavigation[]>("wp/v2/navigation?per_page=50"),
  ]);

  const fromPlugin = columnsFromPlugin(pluginFooter, fallback, origin);
  if (fromPlugin) {
    return fromPlugin;
  }

  const bySlug = new Map<string, FooterColumn>();

  if (Array.isArray(menus) && Array.isArray(items)) {
    for (const menu of menus) {
      if (!menu.id) continue;
      const slot = slotForNav(menu.slug || "", menu.name || "");
      if (!slot) continue;
      const links = itemsForMenu(items, menu.id, origin);
      if (!links.length) continue;
      bySlug.set(slot, {
        title: menu.name?.trim() || slot,
        slug: slot,
        links,
      });
    }
  }

  if (Array.isArray(navigations)) {
    for (const nav of navigations) {
      const title = decodeTitle(nav.title);
      const slot = slotForNav(nav.slug || "", title);
      if (!slot || bySlug.has(slot)) continue;
      const links = linksFromHtml(nav.content?.rendered || "", origin);
      if (!links.length) continue;
      bySlug.set(slot, {
        title: title || slot,
        slug: slot,
        links,
      });
    }
  }

  const hasNav = FOOTER_MENU_SLUGS.some((slug) => bySlug.has(slug));
  const merged = FOOTER_MENU_SLUGS.map((slug, index) => {
    const live = bySlug.get(slug);
    if (live?.links.length) return live;
    return fallback[index];
  }).filter(Boolean) as FooterColumn[];

  if (!hasNav) return null;
  return merged.length ? merged : null;
}
