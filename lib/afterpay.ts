import type { Address } from "@/lib/types";

const SANDBOX = "https://global-api-sandbox.afterpay.com";
const LIVE = "https://global-api.afterpay.com";

function afterpayBase() {
  return process.env.AFTERPAY_ENV?.trim().toLowerCase() === "live" ? LIVE : SANDBOX;
}

export function isAfterpayConfigured() {
  return Boolean(
    process.env.AFTERPAY_MERCHANT_ID?.trim() &&
      process.env.AFTERPAY_SECRET?.trim(),
  );
}

function authHeader() {
  const id = process.env.AFTERPAY_MERCHANT_ID?.trim() || "";
  const secret = process.env.AFTERPAY_SECRET?.trim() || "";
  if (!id || !secret) {
    throw new Error(
      "Afterpay is not configured. Set AFTERPAY_MERCHANT_ID and AFTERPAY_SECRET.",
    );
  }
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

function countryCode(value: string) {
  const raw = value.trim().toUpperCase();
  if (raw === "USA" || raw === "UNITED STATES") return "US";
  return raw.slice(0, 2);
}

function afterpayAddress(address: Address) {
  return {
    name: `${address.firstName} ${address.lastName}`.trim(),
    line1: address.address1.trim(),
    line2: address.address2.trim() || undefined,
    area1: address.city.trim(),
    region: address.state.trim(),
    postcode: address.postcode.trim(),
    countryCode: countryCode(address.country),
  };
}

async function afterpayFetch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${afterpayBase()}${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "EcomBuilder/1.0 (Next.js Storefront)",
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as T & { message?: string; errorCode?: string };
  if (!response.ok) {
    throw new Error(data.message || data.errorCode || "Afterpay request failed.");
  }
  return data;
}

export async function createAfterpayCheckout(input: {
  orderId: string;
  amount: number;
  currency: string;
  email: string;
  shipping: Address;
  billing: Address;
  confirmUrl: string;
  cancelUrl: string;
}) {
  const data = await afterpayFetch<{
    token?: string;
    redirectCheckoutUrl?: string;
  }>("/v2/checkouts", {
    amount: {
      amount: input.amount.toFixed(2),
      currency: input.currency.trim().toUpperCase(),
    },
    consumer: {
      givenNames: input.billing.firstName.trim(),
      surname: input.billing.lastName.trim(),
      email: input.email.trim(),
      phoneNumber: input.billing.phone.trim() || undefined,
    },
    billing: afterpayAddress(input.billing),
    shipping: afterpayAddress(input.shipping),
    merchant: {
      redirectConfirmUrl: input.confirmUrl,
      redirectCancelUrl: input.cancelUrl,
    },
    merchantReference: input.orderId,
  });
  if (!data.token || !data.redirectCheckoutUrl) {
    throw new Error("Could not start Afterpay.");
  }
  return { token: data.token, redirectUrl: data.redirectCheckoutUrl };
}

export async function captureAfterpayPayment(token: string, orderId: string) {
  const data = await afterpayFetch<{
    id?: string;
    status?: string;
    merchantReference?: string;
    originalAmount?: { amount?: string; currency?: string };
  }>("/v2/payments/capture", {
    token,
    merchantReference: orderId,
  });
  if (data.status !== "APPROVED" || !data.id) {
    throw new Error("Afterpay payment was not approved.");
  }
  return {
    paymentId: String(data.id),
    orderId: data.merchantReference || "",
    amount: Number(data.originalAmount?.amount || 0),
    currency: data.originalAmount?.currency || "",
  };
}
