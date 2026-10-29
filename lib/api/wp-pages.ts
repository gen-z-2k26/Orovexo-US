import { getWooOrigin, WOO_TIMEOUT_MS } from "@/lib/api/client";

export type WpPublicPage = {
  id: number;
  slug: string;
  title: string;
  content: string;
};

type WpPageJson = {
  id?: number;
  slug?: string;
  status?: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
};

function decode(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

export async function getWpPage(slug: string): Promise<WpPublicPage | null> {
  const origin = getWooOrigin();
  if (!origin || !slug) return null;

  try {
    const response = await fetch(
      `${origin}/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&status=publish&_fields=id,slug,title,content,status`,
      {
        next: { revalidate: 60, tags: ["wp-pages", `wp-page:${slug}`] },
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(WOO_TIMEOUT_MS),
      },
    );
    if (!response.ok) return null;
    const rows = (await response.json()) as WpPageJson[];
    const page = rows[0];
    if (!page?.id || !page.slug) return null;
    return {
      id: page.id,
      slug: page.slug,
      title: decode(page.title?.rendered || slug),
      content: page.content?.rendered || "",
    };
  } catch {
    return null;
  }
}

export async function listWpPages(): Promise<Array<{ slug: string; title: string }>> {
  const origin = getWooOrigin();
  if (!origin) return [];
  try {
    const response = await fetch(
      `${origin}/wp-json/wp/v2/pages?per_page=50&status=publish&_fields=slug,title`,
      {
        next: { revalidate: 60, tags: ["wp-pages"] },
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(WOO_TIMEOUT_MS),
      },
    );
    if (!response.ok) return [];
    const rows = (await response.json()) as WpPageJson[];
    return rows
      .map((page) => ({
        slug: page.slug || "",
        title: decode(page.title?.rendered || ""),
      }))
      .filter((page) => page.slug);
  } catch {
    return [];
  }
}
