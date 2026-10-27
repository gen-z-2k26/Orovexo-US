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
  promoCoupon: string;
  promoId: string;
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

export interface Address {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

export interface ShippingRate {
  packageId: number;
  rateId: string;
  methodId: string;
  name: string;
  price: number;
  selected: boolean;
}

export interface AppliedCoupon {
  code: string;
  discount: number;
}

export interface StoreCartItem {
  key: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  quantityMin: number;
  quantityMax: number;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  minorUnit: number;
  totalMinor: string;
}

export interface StoreCart {
  items: StoreCartItem[];
  coupons: AppliedCoupon[];
  totals: CartTotals;
  shippingAddress: Address;
  billingAddress: Address;
  needsShipping: boolean;
  needsPayment: boolean;
  hasCalculatedShipping: boolean;
  shippingRates: ShippingRate[];
  errors: string[];
  itemsCount: number;
  cartHash: string;
}

export interface CountryOption {
  code: string;
  name: string;
  states: { code: string; name: string }[];
}

export interface CheckoutDetails {
  shipping: Address;
  billing: Address;
  billingSameAsShipping: boolean;
  customerNote?: string;
}

export interface CheckoutSessionResult {
  orderId: string;
  orderKey: string;
  clientSecret: string;
  amount: number;
  currency: string;
  email: string;
  cart: StoreCart;
  mockPayment?: boolean;
}

export interface CompleteCheckoutPayload {
  orderId: string;
  orderKey: string;
  paymentIntentId: string;
}

export interface CreateOrderResult {
  orderId: string;
  orderKey: string;
  total: number;
  currency: string;
  email: string;
  name: string;
  address: string;
  items: CartItem[];
  createdAt: string;
  paid: boolean;
  status: string;
  transactionId?: string;
}

export interface GuestOrder {
  orderId: string;
  orderKey: string;
  status: string;
  paid: boolean;
  email: string;
  name: string;
  totals: CartTotals;
  items: StoreCartItem[];
  shippingAddress: Address;
  billingAddress: Address;
  coupons: AppliedCoupon[];
  createdAt: string;
}
