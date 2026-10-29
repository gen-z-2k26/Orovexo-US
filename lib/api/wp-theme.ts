import { getWooOrigin, WOO_TIMEOUT_MS } from "@/lib/api/client";

export type WpThemeFonts = {
  font: string;
  fontDisplay: string;
};

export async function fetchWpThemeFonts(): Promise<WpThemeFonts | null> {
  const origin = getWooOrigin();
  if (!origin) return null;
  try {
    const response = await fetch(`${origin}/wp-json/orvexo/v1/theme`, {
      next: { revalidate: 60, tags: ["wp-theme"] },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(WOO_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      font?: string;
      fontDisplay?: string;
    };
    const font = (data.font || "").trim();
    const fontDisplay = (data.fontDisplay || font).trim();
    if (!font && !fontDisplay) return null;
    return { font, fontDisplay: fontDisplay || font };
  } catch {
    return null;
  }
}
