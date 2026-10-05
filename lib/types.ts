export type MotionLevel = "none" | "subtle" | "expressive";

export type HomeSectionType = "hero" | "featuredProducts" | "categories";

export interface HomeSection {
  type: HomeSectionType;
  enabled: boolean;
  props: Record<string, unknown>;
}

export interface StoreTheme {
  primary: string;
  accent: string;
  font: string;
  motion: MotionLevel;
}

export interface StoreSettings {
  id: string;
  name: string;
  logo: string;
  currency: string;
  locale: string;
  theme: StoreTheme;
  homepage: {
    sections: HomeSection[];
  };
}

export interface Product {
  id: string;
  storeId: string;
  slug: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string;
  inStock: boolean;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface CheckoutPayload {
  email: string;
  name: string;
  address: string;
  items: CartItem[];
}

export interface CreateOrderResult {
  orderId: string;
  storeId: string;
  total: number;
  currency: string;
  email: string;
  name: string;
  address: string;
  items: CartItem[];
  createdAt: string;
}
