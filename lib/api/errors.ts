import axios, { type AxiosError } from "axios";

export class WooCommerceApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly endpoint?: string;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: string;
      endpoint?: string;
      cause?: unknown;
    },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "WooCommerceApiError";
    this.status = options?.status;
    this.code = options?.code;
    this.endpoint = options?.endpoint;
  }
}

type WooErrorBody = {
  code?: string;
  message?: string;
  data?: { status?: number; params?: Record<string, unknown> };
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function bodyText(data: unknown): string {
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data ?? "");
  } catch {
    return "";
  }
}

function isBotChallenge(data: unknown, contentType?: string): boolean {
  const text = bodyText(data);
  const type = contentType ?? "";
  if (/text\/html/i.test(type) && /woocommerce|wp-json/i.test(text) === false) {
    if (/jschallenge|Checking your browser|hcdn-cgi|cf-browser-verification/i.test(text)) {
      return true;
    }
  }
  return /jschallenge|Checking your browser|hcdn-cgi|cf-browser-verification/i.test(
    text,
  );
}

function parseWooBody(data: unknown): WooErrorBody | null {
  if (!data || typeof data !== "object") return null;
  return data as WooErrorBody;
}

function endpointFromError(error: AxiosError): string | undefined {
  const base = error.config?.baseURL ?? "";
  const url = error.config?.url ?? "";
  if (!base && !url) return undefined;
  try {
    return new URL(url, base || "http://localhost").pathname;
  } catch {
    return url || undefined;
  }
}

/**
 * Maps Axios / network / WooCommerce REST failures to a typed storefront error.
 */
export function toWooCommerceApiError(error: unknown): WooCommerceApiError {
  if (error instanceof WooCommerceApiError) {
    return error;
  }

  if (!axios.isAxiosError(error)) {
    return new WooCommerceApiError(
      "Something went wrong while loading store data.",
      { cause: error },
    );
  }

  const axiosError = error as AxiosError<unknown>;
  const status = axiosError.response?.status;
  const code = axiosError.code;
  const data = axiosError.response?.data;
  const contentType = asString(axiosError.response?.headers?.["content-type"]);
  const endpoint = endpointFromError(axiosError);
  const woo = parseWooBody(data);
  const wooMessage = woo?.message?.trim();
  const wooCode = woo?.code;
  const message = `${axiosError.message ?? ""} ${code ?? ""}`;

  const isNetworkFailure =
    code === "ETIMEDOUT" ||
    code === "ECONNABORTED" ||
    code === "ENETUNREACH" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ERR_NETWORK" ||
    axiosError.message === "Network Error" ||
    /ETIMEDOUT|ENETUNREACH|ECONNREFUSED|ENOTFOUND|ECONNABORTED|timeout|Network Error/i.test(
      message,
    );

  if (isNetworkFailure) {
    return new WooCommerceApiError(
      "The store server is unreachable right now. Please try again shortly.",
      { code, status, endpoint, cause: error },
    );
  }

  if (isBotChallenge(data, contentType)) {
    return new WooCommerceApiError(
      "The WooCommerce API is blocked by Hostinger bot protection (403). Allow /wp-json/* or whitelist server requests.",
      {
        code: wooCode || code || "bot_challenge",
        status: status ?? 403,
        endpoint,
        cause: error,
      },
    );
  }

  if (status === 401 || status === 403) {
    return new WooCommerceApiError(
      wooMessage ||
        "WooCommerce authentication failed. Check the API keys in .env.local.",
      { code: wooCode || code, status, endpoint, cause: error },
    );
  }

  if (status === 404) {
    return new WooCommerceApiError(
      wooMessage || "The requested WooCommerce data was not found.",
      { code: wooCode || code, status, endpoint, cause: error },
    );
  }

  if (status === 429) {
    return new WooCommerceApiError(
      wooMessage ||
        "Too many requests to WooCommerce. Please try again shortly.",
      { code: wooCode || code, status, endpoint, cause: error },
    );
  }

  if (status && status >= 500) {
    return new WooCommerceApiError(
      wooMessage ||
        "WooCommerce returned a server error. Please try again later.",
      { code: wooCode || code, status, endpoint, cause: error },
    );
  }

  if (status && status >= 400) {
    return new WooCommerceApiError(
      wooMessage ||
        axiosError.message ||
        "WooCommerce rejected the request.",
      { code: wooCode || code, status, endpoint, cause: error },
    );
  }

  return new WooCommerceApiError(
    wooMessage ||
      axiosError.message ||
      "Something went wrong while loading store data.",
    { code: wooCode || code, status, endpoint, cause: error },
  );
}

export async function withWooErrorHandling<T>(
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw toWooCommerceApiError(error);
  }
}

/** Soft wrapper for catalog reads: log and return fallback instead of crashing pages. */
export async function softWooCall<T>(
  action: () => Promise<T>,
  fallback: T,
  label: string,
): Promise<T> {
  try {
    return await withWooErrorHandling(action);
  } catch (error) {
    const mapped = toWooCommerceApiError(error);
    console.warn(`[storefront] ${label}:`, mapped.message, {
      status: mapped.status,
      code: mapped.code,
      endpoint: mapped.endpoint,
    });
    return fallback;
  }
}
