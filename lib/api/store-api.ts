import { cookies } from "next/headers";
import {
  getWooOrigin,
  isWooConfigured,
  isWooUnreachable,
  markWooReachable,
  markWooUnreachable,
  WOO_TIMEOUT_MS,
} from "@/lib/api/client";
import { WooCommerceApiError } from "@/lib/api/errors";
import {
  emptyStoreCart,
  mapGuestOrder,
  mapStoreCart,
  toWooAddress,
  type RawStoreCart,
} from "@/lib/api/map-cart";
import type { Address, GuestOrder, StoreCart } from "@/lib/types";

const CART_COOKIE = "wc_cart_token";
const PENDING_COOKIE = "wc_pending_order";
const TOKEN_MAX_AGE = 60 * 60 * 48;

export type PendingCheckout = {
  orderId: string;
  orderKey: string;
  paymentIntentId: string;
  cartHash: string;
};

type StoreRequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string>;
};

function headerValue(headers: Headers, name: string) {
  return headers.get(name) || headers.get(name.toLowerCase());
}

async function storeRequest<T>(
  path: string,
  options: StoreRequestOptions = {},
): Promise<{ data: T; token: string | null }> {
  const origin = getWooOrigin();
  if (!origin) {
    throw new WooCommerceApiError("WooCommerce is not configured.", {
      code: "missing_env",
    });
  }
  if (isWooUnreachable()) {
    throw new WooCommerceApiError(
      "The store server is unreachable right now. Please try again shortly.",
      { code: "ECONNABORTED" },
    );
  }

  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "Ecom-Builder-Storefront/1.0",
  };
  if (token) headers["Cart-Token"] = token;

  const url = new URL(`${origin}/wp-json/wc/store/v1/${path.replace(/^\//, "")}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      url.searchParams.set(key, value);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      signal: AbortSignal.timeout(WOO_TIMEOUT_MS),
    });
  } catch {
    markWooUnreachable();
    throw new WooCommerceApiError(
      "The store server is unreachable right now. Please try again shortly.",
      { code: "ECONNABORTED", endpoint: url.pathname },
    );
  }
  markWooReachable();

  const nextToken = headerValue(response.headers, "Cart-Token");
  if (nextToken) {
    store.set(CART_COOKIE, nextToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TOKEN_MAX_AGE,
    });
  }

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const body = json as { message?: string; code?: string; data?: { cart?: RawStoreCart } } | null;
    throw new WooCommerceApiError(
      body?.message || "The cart could not be updated.",
      {
        status: response.status,
        code: body?.code,
        endpoint: url.pathname,
      },
    );
  }

  return { data: json as T, token: nextToken };
}

async function cartCall(
  path: string,
  options: StoreRequestOptions = {},
): Promise<StoreCart> {
  if (!isWooConfigured()) return emptyStoreCart();
  const { data } = await storeRequest<RawStoreCart>(path, options);
  return mapStoreCart(data);
}

export async function getStoreCart(): Promise<StoreCart> {
  return cartCall("cart");
}

export async function addStoreCartItem(input: {
  id: number;
  quantity: number;
}): Promise<StoreCart> {
  return cartCall("cart/add-item", {
    method: "POST",
    body: { id: input.id, quantity: input.quantity },
  });
}

export async function updateStoreCartItem(input: {
  key: string;
  quantity: number;
}): Promise<StoreCart> {
  return cartCall("cart/update-item", {
    method: "POST",
    body: { key: input.key, quantity: input.quantity },
  });
}

export async function removeStoreCartItem(key: string): Promise<StoreCart> {
  return cartCall("cart/remove-item", {
    method: "POST",
    body: { key },
  });
}

export async function applyStoreCoupon(code: string): Promise<StoreCart> {
  return cartCall("cart/apply-coupon", {
    method: "POST",
    body: { code },
  });
}

export async function removeStoreCoupon(code: string): Promise<StoreCart> {
  return cartCall("cart/remove-coupon", {
    method: "POST",
    body: { code },
  });
}

export async function updateStoreCustomer(input: {
  shipping: Address;
  billing: Address;
}): Promise<StoreCart> {
  return cartCall("cart/update-customer", {
    method: "POST",
    body: {
      shipping_address: toWooAddress(input.shipping, false),
      billing_address: toWooAddress(input.billing, true),
    },
  });
}

export async function selectStoreShippingRate(input: {
  packageId: number;
  rateId: string;
}): Promise<StoreCart> {
  return cartCall("cart/select-shipping-rate", {
    method: "POST",
    body: { package_id: input.packageId, rate_id: input.rateId },
  });
}

export async function clearStoreCart(): Promise<StoreCart> {
  return cartCall("cart/items", { method: "DELETE" });
}

export async function getGuestStoreOrder(input: {
  orderId: string;
  orderKey: string;
  email: string;
}): Promise<GuestOrder> {
  const { data } = await storeRequest<RawStoreCart & {
    id?: number | string;
    order_key?: string;
    status?: string;
    date_created?: string;
  }>(`order/${encodeURIComponent(input.orderId)}`, {
    query: {
      key: input.orderKey,
      billing_email: input.email,
    },
  });
  return mapGuestOrder(data, input.orderKey);
}

export async function getPendingCheckout(): Promise<PendingCheckout | null> {
  const store = await cookies();
  const raw = store.get(PENDING_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingCheckout;
    if (!parsed.orderId || !parsed.cartHash) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setPendingCheckout(value: PendingCheckout | null) {
  const store = await cookies();
  if (!value) {
    store.delete(PENDING_COOKIE);
    return;
  }
  store.set(PENDING_COOKIE, JSON.stringify(value), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}
