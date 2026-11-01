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

function formatWooStoreAddress(general: Record<string, string>) {
  const line1 = general.woocommerce_store_address?.trim();
  const line2 = general.woocommerce_store_address_2?.trim();
  const city = general.woocommerce_store_city?.trim();
  const postcode = general.woocommerce_store_postcode?.trim();
  const rawCountry = general.woocommerce_default_country?.trim() || "";
  const [countryCode, stateCode] = rawCountry.split(":");
  const locality = [city, stateCode, postcode].filter(Boolean).join(" ");
  const country =
    countryCode === "US" ? "USA" : countryCode ? countryCode : "";
  const parts = [line1, line2, locality, country].filter(Boolean);
  return parts.join(", ");
}

function replaceBrand(text: string, from: string, to: string) {
  if (!text || !from || from === to) return text;
  return text.split(from).join(to);
}

function applyWpBrand(
  design: StoreSettings,
  name: string,
  tagline: string,
): StoreSettings {
  const from = design.name;
  const brand = (value: string) => replaceBrand(value, from, name);

  return {
    ...design,
    name,
    tagline,
    contact: {
      ...design.contact,
      legalName: brand(design.contact.legalName) || name,
    },
    hero: {
      headline: brand(design.hero.headline),
      support: brand(design.hero.support),
    },
    navigation: {
      header: design.navigation.header,
      footerColumns: design.navigation.footerColumns.map((column) => ({
        ...column,
        title: brand(column.title),
      })),
    },
    footer: {
      ...design.footer,
      blurb: brand(design.footer.blurb),
      trustLine: brand(design.footer.trustLine),
      contactTitle: design.footer.contactTitle
        ? brand(design.footer.contactTitle)
        : design.footer.contactTitle,
      chatLine: design.footer.chatLine
        ? brand(design.footer.chatLine)
        : design.footer.chatLine,
    },
    seo: {
      ...design.seo,
      title: brand(design.seo.title),
      description: brand(design.seo.description),
      keywords: design.seo.keywords.map((keyword) => brand(keyword)),
    },
  };
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
    emailSettings?: WooSetting[];
    siteInfo?: WpSiteInfo | null;
    storeMoney?: WooStoreMoney | null;
  },
): StoreSettings {
  const general = settingMap(options.generalSettings ?? []);
  const emailSettings = settingMap(options.emailSettings ?? []);
  const wooEmail = emailSettings.woocommerce_email_from_address?.trim() || "";
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

  const wooAddress = formatWooStoreAddress(general);
  const hasStreet = Boolean(general.woocommerce_store_address?.trim());
  const address =
    design.contact.address.trim() ||
    (hasStreet ? wooAddress : "") ||
    wooAddress;
  const wpName = decodeEntities(site.name || "").trim();
  const wpTagline = decodeEntities(site.description || "").trim();
  const branded = applyWpBrand(
    design,
    wpName || design.name,
    wpTagline || design.tagline,
  );

  return {
    ...branded,
    contact: {
      ...branded.contact,
      address,
      email: wooEmail || branded.contact.email,
    },
    currency,
    currencySymbol: symbol,
    currencyPrefix: prefix,
    currencySuffix: suffix,
    priceDecimals,
    thousandSeparator,
    decimalSeparator,
    seo: {
      ...branded.seo,
      siteUrl: branded.seo.siteUrl || site.url || "",
    },
  };
}
