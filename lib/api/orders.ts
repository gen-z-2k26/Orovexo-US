import { wooGet, wooPost, wooPut } from "@/lib/api/client";
import { withWooErrorHandling } from "@/lib/api/errors";
import { toWooAddress } from "@/lib/api/map-cart";
import { majorTotalsMatch } from "@/lib/money";
import type {
  CartItem,
  CreateOrderResult,
  StoreCart,
} from "@/lib/types";

type WooOrderLineItem = {
  product_id?: number;
  name?: string;
  quantity?: number;
  price?: number | string;
  image?: { src?: string } | string;
};

export type WooOrder = {
  id: number | string;
  status?: string;
  total?: string;
  currency?: string;
  date_created?: string;
  date_paid?: string | null;
  transaction_id?: string;
  order_key?: string;
  billing?: {
    first_name?: string;
    last_name?: string;
    address_1?: string;
    email?: string;
  };
  customer_note?: string;
  line_items?: WooOrderLineItem[];
  meta_data?: Array<{ key?: string; value?: unknown }>;
};

function storefrontOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "";
}

function orderTrackingUrl(order: CreateOrderResult) {
  const origin = storefrontOrigin();
  if (!origin || !order.orderId) return "";
  const params = new URLSearchParams();
  params.set("order", order.orderId);
  if (order.orderKey) params.set("key", order.orderKey);
  if (order.email) params.set("email", order.email);
  return `${origin}/track-your-order?${params.toString()}`;
}

function trackingCustomerNote(order: CreateOrderResult) {
  const trackUrl = orderTrackingUrl(order);
  const lines = [
    `Track this order: ${trackUrl || "open Track Your Order on our site"}`,
    `Order number ${order.orderId}. Order key ${order.orderKey}.`,
  ];
  return lines.join(" ");
}

function lineItemImage(item: WooOrderLineItem) {
  if (typeof item.image === "string") return item.image;
  return item.image?.src || "";
}

function isPaidStatus(order: WooOrder) {
  return (
    order.status === "processing" ||
    order.status === "completed" ||
    Boolean(order.date_paid)
  );
}

export function mapWooOrder(order: WooOrder, cart?: StoreCart): CreateOrderResult {
  const billing = order.billing;
  const name = [billing?.first_name, billing?.last_name].filter(Boolean).join(" ").trim();
  const items: CartItem[] =
    cart?.items.map((item) => ({
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity,
    })) ??
    (order.line_items ?? []).map((item) => ({
      productId: String(item.product_id ?? ""),
      slug: "",
      name: item.name || "Item",
      price: Number(item.price) || 0,
      image: lineItemImage(item),
      quantity: Number(item.quantity) || 1,
    }));

  return {
    orderId: String(order.id),
    orderKey: order.order_key || "",
    total: Number(order.total) || 0,
    currency: order.currency || cart?.totals.currency || "EUR",
    email: billing?.email || cart?.billingAddress.email || "",
    name: name || [cart?.billingAddress.firstName, cart?.billingAddress.lastName].filter(Boolean).join(" "),
    address: billing?.address_1 || cart?.shippingAddress.address1 || "",
    items,
    createdAt: order.date_created || new Date().toISOString(),
    paid: isPaidStatus(order),
    status: order.status || "",
    transactionId: order.transaction_id || undefined,
  };
}

export async function getOrder(orderId: string): Promise<WooOrder> {
  return withWooErrorHandling(async () => {
    return wooGet<WooOrder>(`orders/${orderId}`);
  });
}

export async function createPendingOrderFromCart(
  cart: StoreCart,
  options?: {
    mockPayment?: boolean;
    paymentMethod?: string;
    paymentMethodTitle?: string;
  },
): Promise<CreateOrderResult> {
  if (!cart.items.length) {
    throw new Error("Checkout requires at least one item.");
  }
  const billing = cart.billingAddress;
  const shipping = cart.shippingAddress;
  if (!billing.email || !billing.firstName || !shipping.address1 || !shipping.country) {
    throw new Error("Checkout address is incomplete.");
  }
  if (cart.needsShipping && !cart.shippingRates.some((rate) => rate.selected)) {
    throw new Error("Select a shipping method.");
  }

  return withWooErrorHandling(async () => {
    const selectedShipping = cart.shippingRates.filter((rate) => rate.selected);
    const mockPayment = Boolean(options?.mockPayment);
    const paymentMethod = options?.paymentMethod || "stripe";
    const paymentMethodTitle =
      options?.paymentMethodTitle ||
      (mockPayment
        ? "Credit card (local skip)"
        : paymentMethod === "ppcp-gateway" || paymentMethod === "paypal"
          ? "PayPal"
          : paymentMethod === "afterpay"
            ? "Afterpay"
            : "Credit card (Stripe)");
    const order = await wooPost<WooOrder>("orders", {
      payment_method: paymentMethod,
      payment_method_title: paymentMethodTitle,
      status: "pending",
      set_paid: false,
      billing: toWooAddress(billing, true),
      shipping: toWooAddress(shipping, false),
      line_items: cart.items.map((item) => ({
        product_id: Number(item.productId),
        quantity: item.quantity,
      })),
      ...(cart.coupons.length
        ? { coupon_lines: cart.coupons.map((coupon) => ({ code: coupon.code })) }
        : {}),
      ...(selectedShipping.length
        ? {
            shipping_lines: selectedShipping.map((rate) => ({
              method_id: rate.methodId,
              method_title: rate.name,
              total: rate.price.toFixed(Math.max(0, cart.totals.minorUnit)),
            })),
          }
        : {}),
      meta_data: [
        {
          key: "_created_via_storefront",
          value: mockPayment ? "next-dev-mock" : `next-${paymentMethod}`,
        },
        { key: "_storefront_cart_hash", value: cart.cartHash },
      ],
    });

    if (
      !majorTotalsMatch(order.total, cart.totals.totalMinor, cart.totals.minorUnit)
    ) {
      await wooPut(`orders/${order.id}`, { status: "cancelled" }).catch(() => undefined);
      throw new Error(
        "Order total changed. Review the updated cart total and try again.",
      );
    }

    return mapWooOrder(order, cart);
  });
}

export async function markOrderPaid(
  orderId: string,
  transactionId: string,
  options?: { paymentMethod?: string; paymentMethodTitle?: string },
): Promise<CreateOrderResult> {
  return withWooErrorHandling(async () => {
    const existing = await wooGet<WooOrder>(`orders/${orderId}`);
    if (isPaidStatus(existing)) {
      if (
        existing.transaction_id &&
        existing.transaction_id !== transactionId
      ) {
        throw new Error("This order was already paid with a different payment.");
      }
      return mapWooOrder(existing);
    }

    const mockPayment = transactionId.startsWith("dev_mock_");
    const paymentMethod = options?.paymentMethod || "stripe";
    const mappedPreview = mapWooOrder(existing);
    const order = await wooPut<WooOrder>(`orders/${orderId}`, {
      payment_method: paymentMethod,
      payment_method_title:
        options?.paymentMethodTitle ||
        (mockPayment
          ? "Credit card (local skip)"
          : paymentMethod === "ppcp-gateway" || paymentMethod === "paypal"
            ? "PayPal"
            : paymentMethod === "afterpay"
              ? "Afterpay"
              : "Credit card (Stripe)"),
      set_paid: true,
      transaction_id: transactionId,
      customer_note:
        existing.customer_note?.trim() || trackingCustomerNote(mappedPreview),
    });

    return mapWooOrder(order);
  });
}

export async function cancelUnpaidOrder(orderId: string): Promise<void> {
  return withWooErrorHandling(async () => {
    const existing = await wooGet<WooOrder>(`orders/${orderId}`);
    if (isPaidStatus(existing)) return;
    if (existing.status === "cancelled" || existing.status === "failed") return;
    await wooPut<WooOrder>(`orders/${orderId}`, { status: "cancelled" });
  });
}

export async function failUnpaidOrder(orderId: string): Promise<void> {
  return withWooErrorHandling(async () => {
    const existing = await wooGet<WooOrder>(`orders/${orderId}`);
    if (isPaidStatus(existing)) return;
    if (existing.status === "cancelled" || existing.status === "failed") return;
    await wooPut<WooOrder>(`orders/${orderId}`, { status: "failed" });
  });
}
