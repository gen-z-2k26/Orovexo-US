import { cookies, headers } from "next/headers";
import stores from "@/data/stores.json";
import { DEMO_STORE_COOKIE } from "@/lib/demo-cookie";

/** Custom domains mapped to store ids. Server-only for the mock layer. */
const CUSTOM_DOMAIN_MAP: Record<string, string> = {
  "shop.auroraliving.test": "aurora",
  "www.emberatelier.test": "ember",
};

function knownStoreIds() {
  return new Set(stores.map((store) => store.id));
}

function normalizeHost(rawHost: string | null): string {
  if (!rawHost) return "";
  return rawHost.split(":")[0]?.toLowerCase() ?? "";
}

function storeIdFromHost(host: string): string | null {
  const ids = knownStoreIds();

  if (CUSTOM_DOMAIN_MAP[host]) {
    return CUSTOM_DOMAIN_MAP[host];
  }

  const rootDomain = (
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost"
  ).toLowerCase();

  if (host === rootDomain || host === `www.${rootDomain}`) {
    return null;
  }

  if (host.endsWith(`.${rootDomain}`)) {
    const subdomain = host.slice(0, -(rootDomain.length + 1));
    const candidate = subdomain.split(".")[0];
    if (candidate && ids.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function getCurrentStoreId(): Promise<string> {
  const ids = knownStoreIds();
  const cookieStore = await cookies();
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (demoMode) {
    const demoStoreId = cookieStore.get(DEMO_STORE_COOKIE)?.value;
    if (demoStoreId && ids.has(demoStoreId)) {
      return demoStoreId;
    }
  }

  const headerStore = await headers();
  const host = normalizeHost(headerStore.get("host"));
  const fromHost = storeIdFromHost(host);
  if (fromHost) {
    return fromHost;
  }

  const fallback = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || "aurora";
  if (ids.has(fallback)) {
    return fallback;
  }

  return stores[0]?.id ?? "aurora";
}

