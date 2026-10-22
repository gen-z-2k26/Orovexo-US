import Stripe from "stripe";

const ZERO_DECIMAL = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

let stripe: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local.");
  }
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}

export function toStripeAmount(total: string | number, currency: string) {
  const amount = Number(total);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Order total is invalid.");
  }
  const code = currency.trim().toUpperCase();
  if (ZERO_DECIMAL.has(code)) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

export function stripeAmountMatches(
  total: string | number,
  currency: string,
  stripeAmount: number,
  stripeCurrency: string,
) {
  const expected = toStripeAmount(total, currency);
  return (
    expected === stripeAmount &&
    currency.trim().toLowerCase() === stripeCurrency.trim().toLowerCase()
  );
}
