/** Convert Store API minor-unit strings into major currency units. */
export function fromStoreAmount(
  value: string | number | undefined,
  minorUnit = 2,
): number {
  const raw = Number(value);
  if (!Number.isFinite(raw)) return 0;
  const places = Number.isFinite(minorUnit) ? Math.max(0, minorUnit) : 2;
  if (places === 0) return raw;
  return raw / 10 ** places;
}

export function toStoreAmount(value: number, minorUnit = 2): string {
  const places = Number.isFinite(minorUnit) ? Math.max(0, minorUnit) : 2;
  if (places === 0) return String(Math.round(value));
  return String(Math.round(value * 10 ** places));
}

export function majorTotalsMatch(
  wooTotal: string | number | undefined,
  storeMinor: string | number | undefined,
  minorUnit = 2,
): boolean {
  const places = Number.isFinite(minorUnit) ? Math.max(0, minorUnit) : 2;
  const woo = Number(wooTotal);
  const store = Number(storeMinor);
  if (!Number.isFinite(woo) || !Number.isFinite(store)) return false;
  const wooMinor = Math.round(woo * 10 ** places);
  return wooMinor === Math.round(store);
}
