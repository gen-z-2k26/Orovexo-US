import site from "@/data/site.json";
import {
  getWooOrigin,
  isWooConfigured,
  wooGet,
  wooPost,
} from "@/lib/api/client";
import { softWooCall, withWooErrorHandling } from "@/lib/api/errors";
import {
  mapWooCategory,
  mapWooProduct,
  type WooProduct,
} from "@/lib/api/map-product";
import {
  mergeWooStoreIdentity,
  type WooStoreMoney,
} from "@/lib/api/map-woo-store";
import type {
  Category,
  CheckoutPayload,
  CreateOrderResult,
  Product,
  StoreSettings,
} from "@/lib/types";

const designSettings = site as StoreSettings;
const REVALIDATE_SECONDS = 60;
const CACHE_TTL_MS = REVALIDATE_SECONDS * 1000;

const PRODUCT_FIELDS = [
  "id",
  "name",
  "slug",
  "price",
  "regular_price",
  "sale_price",
  "on_sale",
  "featured",
  "average_rating",
  "rating_count",
  "menu_order",
  "description",
  "short_description",
  "images",
  "categories",
  "stock_status",
].join(",");

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

async function cachedSoftWooCall<T>(
  key: string,
  action: () => Promise<T>,
  fallback: T,
  label: string,
): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    try {
      const value = await withWooErrorHandling(action);
      memoryCache.set(key, {
        value,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return value;
    } catch (error) {
      if (cached) {
        return cached.value;
      }
      return softWooCall(
        async () => {
          throw error;
        },
        fallback,
        label,
      );
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

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

async function fetchStoreMoney(): Promise<WooStoreMoney | null> {
  const origin = getWooOrigin();
  if (!origin) return null;
  try {
    const response = await fetch(`${origin}/wp-json/wc/store/v1/cart`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["woo-money"] },
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { totals?: WooStoreMoney };
    return data.totals ?? null;
  } catch {
    return null;
  }
}

/**
 * Design tokens and UI chrome come from Next (data/site.json).
 * Currency, symbol, and catalog identity overlay from WooCommerce.
 */
export async function getSiteSettings(): Promise<StoreSettings> {
  if (!isWooConfigured()) {
    return designSettings;
  }

  try {
    const [siteInfo, general, storeMoney] = await Promise.all([
      fetchWpSiteInfo(),
      cachedSoftWooCall(
        "settings/general",
        () =>
          wooGet<Array<{ id?: string; value?: string }>>("settings/general"),
        [],
        "settings/general",
      ),
      fetchStoreMoney(),
    ]);

    return mergeWooStoreIdentity(designSettings, {
      generalSettings: general,
      siteInfo,
      storeMoney,
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

  const params: Record<string, string | number | boolean> = {
    per_page: options?.perPage ?? 100,
    page: options?.page ?? 1,
    status: "publish",
    orderby: "menu_order",
    order: "asc",
    _fields: PRODUCT_FIELDS,
  };

  if (options?.featured) params.featured = true;
  if (options?.onSale) params.on_sale = true;
  if (options?.category) params.category = options.category;
  if (options?.include?.length) {
    params.include = options.include.join(",");
    params.orderby = "include";
    params.per_page = options.include.length;
  }

  const cacheKey = `products:${JSON.stringify(params)}`;

  return cachedSoftWooCall(
    cacheKey,
    async () => {
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
  const all = await getProducts({ perPage: 100 });
  const featured = all.filter((product) => product.featured);
  if (featured.length >= limit) return featured.slice(0, limit);

  const seen = new Set(featured.map((product) => product.id));
  for (const product of all) {
    if (seen.has(product.id)) continue;
    featured.push(product);
    if (featured.length >= limit) break;
  }
  return featured.slice(0, limit);
}

export async function getOnSaleProducts(limit = 8): Promise<Product[]> {
  const all = await getProducts({ perPage: 100 });
  return all.filter((product) => product.onSale).slice(0, limit);
}

export async function getProductsByCategory(
  category: string,
): Promise<Product[]> {
  const [categories, allProducts] = await Promise.all([
    getCategoryRecords(),
    getProducts({ perPage: 100 }),
  ]);
  const target = category.toLowerCase();
  const match = categories.find(
    (entry) =>
      entry.slug.toLowerCase() === target ||
      entry.name.toLowerCase() === target,
  );
  if (match) {
    const filtered = allProducts.filter((product) =>
      product.categories.some(
        (cat) =>
          cat.id === match.id ||
          cat.slug.toLowerCase() === match.slug.toLowerCase() ||
          cat.name.toLowerCase() === match.name.toLowerCase(),
      ),
    );
    if (filtered.length > 0) {
      return filtered;
    }
    return getProducts({ category: match.id, perPage: 100 });
  }
  return [];
}

export async function getCategoryRecords(): Promise<Category[]> {
  if (!isWooConfigured()) {
    return [];
  }

  const [rawCategories, allProducts] = await Promise.all([
    cachedSoftWooCall(
      "categories:all",
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
    ),
    getProducts({ perPage: 100 }),
  ]);

  return rawCategories.map((category) => {
    if (category.image) return category;
    const sampleProduct = allProducts.find(
      (product) =>
        product.images.length > 0 &&
        product.categories.some(
          (cat) =>
            cat.id === category.id ||
            cat.slug.toLowerCase() === category.slug.toLowerCase() ||
            cat.name.toLowerCase() === category.name.toLowerCase(),
        ),
    );
    if (!sampleProduct) return category;
    return {
      ...category,
      image: sampleProduct.images[0],
      imageAlt: sampleProduct.imageAlts[0] || category.name,
    };
  });
}

export async function getTopCategories(limit = 6): Promise<Category[]> {
  const all = await getCategoryRecords();
  return all
    .filter(
      (category) =>
        category.parent === 0 && category.slug.toLowerCase() !== "uncategorized",
    )
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

  const all = await getProducts({ perPage: 100 });
  const fromCatalog = all.find((entry) => entry.slug === slug);
  if (fromCatalog) {
    return fromCatalog;
  }

  return cachedSoftWooCall(
    `product:slug:${slug}`,
    async () => {
      const data = await wooGet<WooProduct[]>("products", {
        slug,
        _fields: PRODUCT_FIELDS,
      });
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
