import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { toWooCommerceApiError, WooCommerceApiError } from "@/lib/api/errors";

export const WOO_TIMEOUT_MS = 6_000;
const WOO_DOWN_MS = 45_000;

let wooDownUntil = 0;

export function isWooUnreachable() {
  return Date.now() < wooDownUntil;
}

export function markWooUnreachable() {
  wooDownUntil = Date.now() + WOO_DOWN_MS;
}

export function markWooReachable() {
  wooDownUntil = 0;
}

function throwIfWooDown() {
  if (!isWooUnreachable()) return;
  throw new WooCommerceApiError(
    "The store server is unreachable right now. Please try again shortly.",
    { code: "ECONNABORTED" },
  );
}

export function isWooConfigured() {
  return Boolean(
    process.env.WC_URL &&
      process.env.WC_CONSUMER_KEY &&
      process.env.WC_CONSUMER_SECRET,
  );
}

export function getWooOrigin() {
  const raw = process.env.WC_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "").replace(/^http:\/\//i, "https://");
}

function requireEnv(name: "WC_URL" | "WC_CONSUMER_KEY" | "WC_CONSUMER_SECRET") {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new WooCommerceApiError(
      `WooCommerce is not configured. Set ${name} in .env.local.`,
      { code: "missing_env" },
    );
  }
  return value;
}

function assertJsonPayload(response: AxiosResponse) {
  const contentType = String(response.headers["content-type"] ?? "");
  const data = response.data;

  if (typeof data === "string") {
    const trimmed = data.trim();
    if (
      trimmed.startsWith("<!DOCTYPE") ||
      trimmed.startsWith("<html") ||
      /jschallenge|Checking your browser|hcdn-cgi/i.test(trimmed)
    ) {
      throw new WooCommerceApiError(
        "The WooCommerce API is blocked by Hostinger bot protection. Allow /wp-json/* or disable bot protection for the site.",
        {
          status: response.status,
          code: "bot_challenge",
          endpoint: response.config.url,
        },
      );
    }
  }

  if (
    contentType &&
    !/application\/json|application\/.*\+json/i.test(contentType) &&
    typeof data === "string"
  ) {
    throw new WooCommerceApiError(
      "WooCommerce did not return JSON. Check that /wp-json/wc/v3 is reachable.",
      {
        status: response.status,
        code: "invalid_content_type",
        endpoint: response.config.url,
      },
    );
  }
}

let cachedClient: AxiosInstance | null = null;

/**
 * Shared Axios client for WooCommerce REST (wc/v3).
 * Uses HTTPS Basic Auth with consumer key / secret.
 */
export function getWooClient(): AxiosInstance {
  if (cachedClient) return cachedClient;

  // Hostinger redirects HTTP to HTTPS and drops Basic Auth on the follow-up,
  // which surfaces as 401 woocommerce_rest_cannot_view. Always call HTTPS.
  const origin = requireEnv("WC_URL")
    .replace(/\/$/, "")
    .replace(/^http:\/\//i, "https://");
  const baseURL = `${origin}/wp-json/wc/v3/`;
  const consumerKey = requireEnv("WC_CONSUMER_KEY");
  const consumerSecret = requireEnv("WC_CONSUMER_SECRET");

  const client = axios.create({
    baseURL,
    timeout: WOO_TIMEOUT_MS,
    auth: {
      username: consumerKey,
      password: consumerSecret,
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Ecom-Builder-Storefront/1.0",
    },
    // Avoid following HTML challenge redirects as success.
    maxRedirects: 3,
    validateStatus: (status) => status >= 200 && status < 300,
  });

  client.interceptors.response.use(
    (response) => {
      markWooReachable();
      assertJsonPayload(response);
      return response;
    },
    (error) => {
      const mapped = toWooCommerceApiError(error);
      if (
        mapped.code === "ETIMEDOUT" ||
        mapped.code === "ECONNABORTED" ||
        mapped.code === "ENETUNREACH" ||
        mapped.code === "ECONNREFUSED" ||
        mapped.code === "ENOTFOUND" ||
        mapped.code === "ERR_NETWORK"
      ) {
        markWooUnreachable();
      }
      throw mapped;
    },
  );

  cachedClient = client;
  return client;
}

export type WooQuery = Record<
  string,
  string | number | boolean | Array<string | number> | undefined
>;

function cleanParams(params?: WooQuery) {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      out[key] = value.join(",");
      continue;
    }
    out[key] = value;
  }
  return out;
}

/** GET helper that returns response.data and maps Axios errors. */
export async function wooGet<T>(
  path: string,
  params?: WooQuery,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await wooGetWithHeaders<T>(path, params, config);
  return data;
}

/** GET helper that also returns response headers (pagination totals). */
export async function wooGetWithHeaders<T>(
  path: string,
  params?: WooQuery,
  config?: AxiosRequestConfig,
): Promise<{ data: T; headers: AxiosResponse["headers"] }> {
  if (!isWooConfigured()) {
    throw new WooCommerceApiError(
      "WooCommerce is not configured. Set WC_URL, WC_CONSUMER_KEY, and WC_CONSUMER_SECRET.",
      { code: "missing_env" },
    );
  }
  throwIfWooDown();

  const response = await getWooClient().get<T>(path.replace(/^\//, ""), {
    ...config,
    params: cleanParams(params),
  });
  return { data: response.data, headers: response.headers };
}

/** POST helper that returns response.data and maps Axios errors. */
export async function wooPost<T>(
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  if (!isWooConfigured()) {
    throw new WooCommerceApiError(
      "WooCommerce is not configured. Set WC_URL, WC_CONSUMER_KEY, and WC_CONSUMER_SECRET.",
      { code: "missing_env" },
    );
  }
  throwIfWooDown();

  const response = await getWooClient().post<T>(
    path.replace(/^\//, ""),
    body,
    config,
  );
  return response.data;
}

/** PUT helper that returns response.data and maps Axios errors. */
export async function wooPut<T>(
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  if (!isWooConfigured()) {
    throw new WooCommerceApiError(
      "WooCommerce is not configured. Set WC_URL, WC_CONSUMER_KEY, and WC_CONSUMER_SECRET.",
      { code: "missing_env" },
    );
  }
  throwIfWooDown();

  const response = await getWooClient().put<T>(
    path.replace(/^\//, ""),
    body,
    config,
  );
  return response.data;
}
