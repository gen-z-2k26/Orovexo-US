import type { StoreSettings } from "@/lib/types";

type WooSetting = {
  id?: string;
  value?: string;
};

type WpSiteInfo = {
  name?: string;
  description?: string;
  url?: string;
};

function settingMap(rows: WooSetting[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    if (row.id && typeof row.value === "string") {
      out[row.id] = row.value;
    }
  }
  return out;
}

/**
 * Overlays live WooCommerce currency (and optional site URL) onto the Next design config.
 * Branding, hero/footer copy, and contact stay in data/site.json so the demo chrome stays dummy.
 */
export function mergeWooStoreIdentity(
  design: StoreSettings,
  options: {
    generalSettings?: WooSetting[];
    siteInfo?: WpSiteInfo | null;
  },
): StoreSettings {
  const general = settingMap(options.generalSettings ?? []);
  const site = options.siteInfo ?? {};
  const currency = general.woocommerce_currency || design.currency;

  return {
    ...design,
    currency,
    seo: {
      ...design.seo,
      siteUrl: design.seo.siteUrl || site.url || "",
    },
  };
}
