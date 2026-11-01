import type { Address } from "@/lib/types";

const COUNTRY_ALIASES: Record<string, string> = {
  USA: "US",
  "UNITED STATES": "US",
  "UNITED STATES OF AMERICA": "US",
};

export function stripePersonName(address: Address) {
  return `${address.firstName} ${address.lastName}`.trim();
}

function stripeCountry(value: string) {
  const raw = value.trim().toUpperCase();
  if (COUNTRY_ALIASES[raw]) return COUNTRY_ALIASES[raw];
  if (raw.length === 2) return raw;
  return raw.slice(0, 2);
}

export function stripeAddressFields(address: Address) {
  const fields: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  } = {
    line1: address.address1.trim(),
    city: address.city.trim(),
    postal_code: address.postcode.trim(),
    country: stripeCountry(address.country),
  };
  if (address.address2.trim()) fields.line2 = address.address2.trim();
  if (address.state.trim()) fields.state = address.state.trim();
  return fields;
}

export function stripeShippingParams(address: Address) {
  return {
    name: stripePersonName(address),
    phone: address.phone.trim() || undefined,
    address: stripeAddressFields(address),
  };
}

export function stripeBillingDetails(address: Address, email: string) {
  return {
    name: stripePersonName(address),
    email: email.trim() || address.email.trim() || undefined,
    phone: address.phone.trim() || undefined,
    address: stripeAddressFields(address),
  };
}
