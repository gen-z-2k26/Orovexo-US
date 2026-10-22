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

export type WooStoreMoney = {
  currency_code?: string;
  currency_symbol?: string;
  currency_minor_unit?: number;
  currency_decimal_separator?: string;
  currency_thousand_separator?: string;
  currency_prefix?: string;
  currency_suffix?: string;
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

function decodeEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&euro;/gi, "€")
    .replace(/&pound;/gi, "£")
    .replace(/&yen;/gi, "¥")
    .replace(/&dollar;/gi, "$")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
}

function prefixSuffixFromPosition(symbol: string, position: string) {
  switch (position) {
    case "right":
      return { prefix: "", suffix: symbol };
    case "left_space":
      return { prefix: `${symbol} `, suffix: "" };
    case "right_space":
      return { prefix: "", suffix: ` ${symbol}` };
    default:
      return { prefix: symbol, suffix: "" };
  }
}

/**
 * Overlays live WooCommerce money settings onto the Next design config.
 */
export function mergeWooStoreIdentity(
  design: StoreSettings,
  options: {
    generalSettings?: WooSetting[];
    siteInfo?: WpSiteInfo | null;
    storeMoney?: WooStoreMoney | null;
  },
): StoreSettings {
  const general = settingMap(options.generalSettings ?? []);
  const site = options.siteInfo ?? {};
  const money = options.storeMoney ?? {};

  const currency =
    money.currency_code || general.woocommerce_currency || design.currency;
  const symbol = decodeEntities(
    money.currency_symbol || design.currencySymbol || "",
  );
  const fromPosition = prefixSuffixFromPosition(
    symbol,
    general.woocommerce_currency_pos || "left",
  );
  const prefix = decodeEntities(
    money.currency_prefix ?? fromPosition.prefix ?? design.currencyPrefix,
  );
  const suffix = decodeEntities(
    money.currency_suffix ?? fromPosition.suffix ?? design.currencySuffix,
  );
  const priceDecimals =
    typeof money.currency_minor_unit === "number"
      ? money.currency_minor_unit
      : Number.isFinite(Number(general.woocommerce_price_num_decimals))
        ? Number(general.woocommerce_price_num_decimals)
        : design.priceDecimals;
  const thousandSeparator =
    money.currency_thousand_separator ??
    general.woocommerce_price_thousand_sep ??
    design.thousandSeparator;
  const decimalSeparator =
    money.currency_decimal_separator ??
    general.woocommerce_price_decimal_sep ??
    design.decimalSeparator;

  return {
    ...design,
    currency,
    currencySymbol: symbol,
    currencyPrefix: prefix,
    currencySuffix: suffix,
    priceDecimals,
    thousandSeparator,
    decimalSeparator,
    seo: {
      ...design.seo,
      siteUrl: design.seo.siteUrl || site.url || "",
    },
  };
}
