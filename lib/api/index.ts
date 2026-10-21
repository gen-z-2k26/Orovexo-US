import site from "@/data/site.json";
import { isWooConfigured, wooGet, wooPost } from "@/lib/api/client";
import { softWooCall, withWooErrorHandling } from "@/lib/api/errors";
import {
  mapWooCategory,
  mapWooProduct,
  type WooProduct,
} from "@/lib/api/map-product";
import { mergeWooStoreIdentity } from "@/lib/api/map-woo-store";
import type {
  Category,
  CheckoutPayload,
  CreateOrderResult,
  Product,
  StoreSettings,
} from "@/lib/types";

const designSettings = site as StoreSettings;
const REVALIDATE_SECONDS = 60;

async function fetchWpSiteInfo(): Promise<{
  name?: string;
  description?: string;
  url?: string;
} | null> {
  if (!process.env.WC_URL) return null;
  try {
    const wpOrigin = process.env.WC_URL.replace(/\/$/, "").replace(
      /^http:\/\//i,
      "https://",
    );
    const response = await fetch(
      `${wpOrigin}/wp-json`,
      {
        next: { revalidate: REVALIDATE_SECONDS, tags: ["wp-site"] },
        headers: { Accept: "application/json" },
      },
    );
    if (!response.ok) return null;
    return (await response.json()) as {
      name?: string;
      description?: string;
      url?: string;
    };
  } catch {
    return null;
  }
}

/**
 * Design tokens and UI chrome come from Next (data/site.json).
 * Currency (and site URL when present) can be overlaid from WooCommerce.
 * Name, tagline, hero, footer, and contact stay in the design file.
 */
export async function getSiteSettings(): Promise<StoreSettings> {
  if (!isWooConfigured()) {
    return designSettings;
  }

  try {
    const [siteInfo, general] = await Promise.all([
      fetchWpSiteInfo(),
      softWooCall(
        () =>
          wooGet<Array<{ id?: string; value?: string }>>("settings/general"),
        [],
        "settings/general",
      ),
    ]);

    return mergeWooStoreIdentity(designSettings, {
      generalSettings: general,
      siteInfo,
    });
  } catch (error) {
    console.warn("[storefront] store identity fetch failed:", error);
    return designSettings;
  }
}

/** @deprecated Use getSiteSettings. */
export async function getStoreSettings(): Promise<StoreSettings> {
  return getSiteSettings();
}

export async function getProducts(options?: {
  featured?: boolean;
  include?: number[];
  category?: number;
  onSale?: boolean;
  perPage?: number;
  page?: number;
}): Promise<Product[]> {
  if (!isWooConfigured()) {
    return [];
  }

  return softWooCall(
    async () => {
      const params: Record<string, string | number | boolean> = {
        per_page: options?.perPage ?? 100,
        page: options?.page ?? 1,
        status: "publish",
        orderby: "menu_order",
        order: "asc",
      };

      if (options?.featured) params.featured = true;
      if (options?.onSale) params.on_sale = true;
      if (options?.category) params.category = options.category;
      if (options?.include?.length) {
        params.include = options.include.join(",");
        params.orderby = "include";
        params.per_page = options.include.length;
      }

      const data = await wooGet<WooProduct[]>("products", params);
      return data.map(mapWooProduct);
    },
    [],
    "getProducts",
  );
}

export async function getProductsByIds(ids: number[]): Promise<Product[]> {
  if (!ids.length) return [];
  return getProducts({ include: ids, perPage: ids.length });
}

/** Featured products as marked in WooCommerce admin. Falls back to latest products. */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const featured = await getProducts({ featured: true, perPage: limit });
  if (featured.length >= limit) return featured.slice(0, limit);

  const rest = await getProducts({ perPage: limit });
  const seen = new Set(featured.map((product) => product.id));
  for (const product of rest) {
    if (seen.has(product.id)) continue;
    featured.push(product);
    if (featured.length >= limit) break;
  }
  return featured.slice(0, limit);
}

export async function getOnSaleProducts(limit = 8): Promise<Product[]> {
  return getProducts({ onSale: true, perPage: limit });
}

export async function getProductsByCategory(
  category: string,
): Promise<Product[]> {
  const categories = await getCategoryRecords();
  const match = categories.find(
    (entry) =>
      entry.slug === category ||
      entry.name.toLowerCase() === category.toLowerCase(),
  );
  if (match) {
    return getProducts({ category: match.id, perPage: 100 });
  }
  return [];
}

export async function getCategoryRecords(): Promise<Category[]> {
  if (!isWooConfigured()) {
    return [];
  }

  return softWooCall(
    async () => {
      const data = await wooGet<Parameters<typeof mapWooCategory>[0][]>(
        "products/categories",
        {
          per_page: 100,
          hide_empty: true,
          orderby: "count",
          order: "desc",
        },
      );
      return data.map(mapWooCategory);
    },
    [],
    "getCategoryRecords",
  );
}

export async function getTopCategories(limit = 6): Promise<Category[]> {
  const all = await getCategoryRecords();
  return all
    .filter((category) => category.parent === 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export async function getCategories(): Promise<string[]> {
  const categories = await getCategoryRecords();
  return Array.from(new Set(categories.map((entry) => entry.name))).sort();
}

export async function getProduct(slug: string): Promise<Product | null> {
  if (!isWooConfigured()) {
    return null;
  }

  return softWooCall(
    async () => {
      const data = await wooGet<WooProduct[]>("products", { slug });
      const [product] = data;
      return product ? mapWooProduct(product) : null;
    },
    null,
    `getProduct(${slug})`,
  );
}

export async function createOrder(
  payload: CheckoutPayload,
): Promise<CreateOrderResult> {
  if (!payload.email || !payload.name || !payload.address) {
    throw new Error("Checkout payload is incomplete.");
  }
  if (!payload.items.length) {
    throw new Error("Checkout requires at least one item.");
  }

  const settings = await getSiteSettings();

  return withWooErrorHandling(async () => {
    const [firstName, ...rest] = payload.name.trim().split(/\s+/);
    const order = await wooPost<{
      id: number | string;
      total?: string;
      currency?: string;
      date_created?: string;
    }>("orders", {
      payment_method: "cod",
      payment_method_title: "Cash on delivery",
      set_paid: false,
      billing: {
        first_name: firstName || payload.name,
        last_name: rest.join(" ") || "-",
        address_1: payload.address,
        email: payload.email,
        country: "NL",
      },
      line_items: payload.items.map((item) => ({
        product_id: Number(item.productId),
        quantity: item.quantity,
      })),
    });

    const total = payload.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    return {
      orderId: String(order.id),
      total: Number(order.total) || total,
      currency: order.currency || settings.currency,
      email: payload.email,
      name: payload.name,
      address: payload.address,
      items: payload.items,
      createdAt: order.date_created || new Date().toISOString(),
    };
  });
}

export function getSiteUrl(settings?: StoreSettings) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const fromSettings = settings?.seo.siteUrl?.replace(/\/$/, "");
  if (fromSettings) return fromSettings;
  return "";
}
