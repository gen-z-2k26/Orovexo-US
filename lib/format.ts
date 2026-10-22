import type { StoreSettings } from "@/lib/types";

function formatNumber(
  amount: number,
  decimals: number,
  thousandSeparator: string,
  decimalSeparator: string,
) {
  const safeDecimals = Number.isFinite(decimals) ? Math.max(0, decimals) : 2;
  const [integer, fraction] = Math.abs(amount).toFixed(safeDecimals).split(".");
  const grouped = thousandSeparator
    ? integer.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator)
    : integer;
  const body =
    safeDecimals > 0 && fraction
      ? `${grouped}${decimalSeparator || "."}${fraction}`
      : grouped;
  return amount < 0 ? `-${body}` : body;
}

/** Formats using WooCommerce currency settings, not a hardcoded symbol. */
export function formatPrice(amount: number, settings: StoreSettings): string {
  const number = formatNumber(
    amount,
    settings.priceDecimals,
    settings.thousandSeparator,
    settings.decimalSeparator,
  );
  const prefix = settings.currencyPrefix || settings.currencySymbol;
  const suffix = settings.currencySuffix;
  if (prefix || suffix) {
    return `${prefix}${number}${suffix}`;
  }
  if (settings.currency) {
    return `${number} ${settings.currency}`;
  }
  return number;
}
