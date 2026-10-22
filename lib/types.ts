export type MotionLevel = "none" | "subtle" | "expressive";
export type ColorMode = "light" | "dark" | "system";

export type TrustIcon =
  | "truck"
  | "refresh"
  | "shield"
  | "message"
  | "package"
  | "clock"
  | "star"
  | "heart";

export interface NavLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export interface TrustItem {
  icon: TrustIcon;
  title: string;
  text: string;
  number?: string;
}

/** One palette mode. Values are hex or CSS colors. */
export interface ThemePalette {
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  card: string;
  muted: string;
  mutedForeground: string;
  border: string;
}

/**
 * Design tokens live in the Next.js app (data/site.json).
 * Store identity and catalog data come from WooCommerce.
 */
export interface StoreTheme {
  font: string;
  fontDisplay: string;
  radius: string;
  defaultMode: ColorMode;
  motion: MotionLevel;
  light: ThemePalette;
  dark: ThemePalette;
}

export interface SiteSeo {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  siteUrl: string;
}

/** Design chrome from site.json; money and catalog identity come from Woo. */
export interface StoreSettings {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  currency: string;
  currencySymbol: string;
  currencyPrefix: string;
  currencySuffix: string;
  priceDecimals: number;
  thousandSeparator: string;
  decimalSeparator: string;
  locale: string;
  contact: {
    email: string;
    phone: string;
    address: string;
    openingHours: string;
    legalName: string;
    vatNumber: string;
  };
  promoBanner: string;
  hero: {
    headline: string;
    support: string;
  };
  navigation: {
    header: NavLink[];
    footerColumns: FooterColumn[];
  };
  footer: {
    blurb: string;
    trustLine: string;
  };
  seo: SiteSeo;
  theme: StoreTheme;
}

export interface ProductCategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  regularPrice: number;
  salePrice: number | null;
  onSale: boolean;
  description: string;
  images: string[];
  imageAlts: string[];
  category: string;
  categories: ProductCategoryRef[];
  featured: boolean;
  averageRating: number;
  ratingCount: number;
  menuOrder: number;
  inStock: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  imageAlt: string;
  count: number;
  parent: number;
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
  total: number;
  currency: string;
  email: string;
  name: string;
  address: string;
  items: CartItem[];
  createdAt: string;
}
