import site from "@/data/site.json";
import {
  getWooOrigin,
  isWooConfigured,
  wooGet,
  wooPost,
  wooPut,
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
  CartItem,
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

type WooOrderLineItem = {
  product_id?: number;
  name?: string;
  quantity?: number;
  price?: number | string;
  image?: { src?: string } | string;
};

export type WooOrder = {
  id: number | string;
  status?: string;
  total?: string;
  currency?: string;
  date_created?: string;
  transaction_id?: string;
  billing?: {
    first_name?: string;
    last_name?: string;
    address_1?: string;
    email?: string;
  };
  line_items?: WooOrderLineItem[];
};

function splitName(name: string) {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  return {
    firstName: firstName || name,
    lastName: rest.join(" ") || "-",
  };
}

function lineItemImage(item: WooOrderLineItem) {
  if (typeof item.image === "string") return item.image;
  return item.image?.src || "";
}

function mapWooOrder(order: WooOrder, fallback?: CheckoutPayload): CreateOrderResult {
  const billing = order.billing;
  const name =
    fallback?.name ||
    [billing?.first_name, billing?.last_name].filter(Boolean).join(" ").trim();
  const items: CartItem[] =
    fallback?.items ??
    (order.line_items ?? []).map((item) => ({
      productId: String(item.product_id ?? ""),
      slug: "",
      name: item.name || "Item",
      price: Number(item.price) || 0,
      image: lineItemImage(item),
      quantity: Number(item.quantity) || 1,
    }));
  const paid =
    order.status === "processing" ||
    order.status === "completed" ||
    Boolean(order.transaction_id);

  return {
    orderId: String(order.id),
    total: Number(order.total) || 0,
    currency: order.currency || "EUR",
    email: fallback?.email || billing?.email || "",
    name,
    address: fallback?.address || billing?.address_1 || "",
    items,
    createdAt: order.date_created || new Date().toISOString(),
    paid,
    transactionId: order.transaction_id || undefined,
  };
}

async function fetchLiveCheckoutProducts(ids: number[]): Promise<Product[]> {
  const unique = [...new Set(ids)];
  const data = await wooGet<WooProduct[]>("products", {
    include: unique.join(","),
    per_page: unique.length,
    status: "publish",
    _fields: `${PRODUCT_FIELDS},purchasable`,
  });
  return data.map(mapWooProduct);
}

export async function createPendingOrder(
  payload: CheckoutPayload,
): Promise<CreateOrderResult> {
  if (!payload.email || !payload.name || !payload.address) {
    throw new Error("Checkout payload is incomplete.");
  }
  if (!payload.items.length) {
    throw new Error("Checkout requires at least one item.");
  }

  return withWooErrorHandling(async () => {
    const ids = payload.items.map((item) => Number(item.productId));
    if (ids.some((id) => !Number.isFinite(id) || id <= 0)) {
      throw new Error("Cart contains an invalid product.");
    }

    const products = await fetchLiveCheckoutProducts(ids);
    const byId = new Map(products.map((product) => [product.id, product]));

    for (const item of payload.items) {
      const product = byId.get(item.productId);
      if (!product) {
        throw new Error(`${item.name} is no longer available.`);
      }
      if (!product.inStock) {
        throw new Error(`${product.name} is out of stock.`);
      }
    }

    const { firstName, lastName } = splitName(payload.name);
    const order = await wooPost<WooOrder>("orders", {
      payment_method: "stripe",
      payment_method_title: "Credit card (Stripe)",
      status: "pending",
      set_paid: false,
      billing: {
        first_name: firstName,
        last_name: lastName,
        address_1: payload.address,
        email: payload.email,
        country: "NL",
      },
      shipping: {
        first_name: firstName,
        last_name: lastName,
        address_1: payload.address,
        country: "NL",
      },
      line_items: payload.items.map((item) => ({
        product_id: Number(item.productId),
        quantity: item.quantity,
      })),
      meta_data: [{ key: "_created_via_storefront", value: "next-stripe" }],
    });

    const pricedItems = payload.items.map((item) => {
      const product = byId.get(item.productId);
      return {
        ...item,
        name: product?.name || item.name,
        price: product?.price ?? item.price,
        image: product?.images[0] || item.image,
      };
    });

    return mapWooOrder(order, { ...payload, items: pricedItems });
  });
}

export async function getOrder(orderId: string): Promise<WooOrder> {
  return withWooErrorHandling(async () => {
    return wooGet<WooOrder>(`orders/${orderId}`);
  });
}

export async function markOrderPaid(
  orderId: string,
  transactionId: string,
): Promise<CreateOrderResult> {
  return withWooErrorHandling(async () => {
    const existing = await wooGet<WooOrder>(`orders/${orderId}`);
    const alreadyPaid =
      existing.status === "processing" || existing.status === "completed";
    if (alreadyPaid) {
      if (
        existing.transaction_id &&
        existing.transaction_id !== transactionId
      ) {
        throw new Error("This order was already paid with a different payment.");
      }
      return mapWooOrder(existing);
    }

    const order = await wooPut<WooOrder>(`orders/${orderId}`, {
      payment_method: "stripe",
      payment_method_title: "Credit card (Stripe)",
      set_paid: true,
      transaction_id: transactionId,
    });

    return mapWooOrder(order);
  });
}

export function getSiteUrl(settings?: StoreSettings) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const fromSettings = settings?.seo.siteUrl?.replace(/\/$/, "");
  if (fromSettings) return fromSettings;
  return "";
}
