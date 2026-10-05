import stores from "@/data/stores.json";
import products from "@/data/products.json";
import type {
  CheckoutPayload,
  CreateOrderResult,
  Product,
  StoreSettings,
} from "@/lib/types";

const storeCatalog = stores as StoreSettings[];
const productCatalog = products as Product[];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withLatency<T>(value: T): Promise<T> {
  const ms = 300 + Math.floor(Math.random() * 301);
  await delay(ms);
  return value;
}

export async function getStoreSettings(storeId: string): Promise<StoreSettings> {
  const store = storeCatalog.find((entry) => entry.id === storeId);
  if (!store) {
    throw new Error(`Unknown store: ${storeId}`);
  }
  return withLatency(store);
}

export async function listStores(): Promise<
  Pick<StoreSettings, "id" | "name" | "logo">[]
> {
  return withLatency(
    storeCatalog.map((store) => ({
      id: store.id,
      name: store.name,
      logo: store.logo,
    })),
  );
}

export async function getProducts(storeId: string): Promise<Product[]> {
  return withLatency(
    productCatalog.filter((product) => product.storeId === storeId),
  );
}

export async function getProductsByCategory(
  storeId: string,
  category: string,
): Promise<Product[]> {
  return withLatency(
    productCatalog.filter(
      (product) =>
        product.storeId === storeId && product.category === category,
    ),
  );
}

export async function getCategories(storeId: string): Promise<string[]> {
  const categories = new Set(
    productCatalog
      .filter((product) => product.storeId === storeId)
      .map((product) => product.category),
  );
  return withLatency(Array.from(categories).sort());
}

export async function getProduct(
  storeId: string,
  slug: string,
): Promise<Product | null> {
  const product =
    productCatalog.find(
      (entry) => entry.storeId === storeId && entry.slug === slug,
    ) ?? null;
  return withLatency(product);
}

export async function createOrder(
  storeId: string,
  payload: CheckoutPayload,
): Promise<CreateOrderResult> {
  const store = storeCatalog.find((entry) => entry.id === storeId);
  if (!store) {
    throw new Error(`Unknown store: ${storeId}`);
  }

  if (!payload.email || !payload.name || !payload.address) {
    throw new Error("Checkout payload is incomplete.");
  }

  if (!payload.items.length) {
    throw new Error("Checkout requires at least one item.");
  }

  const total = payload.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const result: CreateOrderResult = {
    orderId: `ord_${storeId}_${Date.now()}`,
    storeId,
    total,
    currency: store.currency,
    email: payload.email,
    name: payload.name,
    address: payload.address,
    items: payload.items,
    createdAt: new Date().toISOString(),
  };

  return withLatency(result);
}
