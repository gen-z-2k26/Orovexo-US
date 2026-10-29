"use server";

import {
  cancelUnpaidOrder,
  createPendingOrderFromCart,
  getCountries,
  getDefaultCountry,
  getEnabledCheckoutMethods,
  getOrder,
  markOrderPaid,
} from "@/lib/api";
import { wooPayUrl } from "@/lib/api/payments";
import {
  getPendingCheckout,
  getStoreCart,
  setPendingCheckout,
  updateStoreCustomer,
  clearStoreCart,
} from "@/lib/api/store-api";
import {
  getStripe,
  isMockPaymentEnabled,
  isMockPaymentIntentId,
  isStripeConfigured,
  mockPaymentIntentId,
  stripeAmountMatches,
} from "@/lib/stripe";
import type {
  CheckoutDetails,
  CheckoutSessionResult,
  CompleteCheckoutPayload,
  CheckoutPaymentKind,
  CheckoutPaymentMethod,
  CountryOption,
  CreateOrderResult,
  StoreCart,
} from "@/lib/types";

function requireStripe() {
  if (!isStripeConfigured()) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local.",
    );
  }
  return getStripe();
}

export async function getCheckoutOptionsAction(): Promise<{
  cart: StoreCart;
  countries: CountryOption[];
  defaultCountry: string;
  mockPayment: boolean;
  paymentMethods: CheckoutPaymentMethod[];
}> {
  const [cart, countries, defaultCountry, paymentMethods] = await Promise.all([
    getStoreCart(),
    getCountries(),
    getDefaultCountry(),
    getEnabledCheckoutMethods(),
  ]);
  return {
    cart,
    countries,
    defaultCountry,
    mockPayment: isMockPaymentEnabled(),
    paymentMethods,
  };
}

async function abandonPendingIfStale(cartHash: string) {
  const pending = await getPendingCheckout();
  if (!pending) return;
  if (pending.cartHash === cartHash) return;
  const stripe = isStripeConfigured() ? getStripe() : null;
  if (pending.paymentIntentId?.startsWith("pi_") && stripe) {
    try {
      await stripe.paymentIntents.cancel(pending.paymentIntentId);
    } catch {
      // Already cancelled or succeeded.
    }
  }
  try {
    await cancelUnpaidOrder(pending.orderId);
  } catch {
    // Order may already be gone.
  }
  await setPendingCheckout(null);
}

export async function createCheckoutSessionAction(
  details: CheckoutDetails,
): Promise<CheckoutSessionResult> {
  const mockPayment = isMockPaymentEnabled();
  const methods = mockPayment ? [] : await getEnabledCheckoutMethods();
  const selected =
    methods.find((method) => method.kind === details.paymentKind) ||
    methods[0];
  if (!mockPayment && !selected) {
    throw new Error(
      "No payment methods are enabled. Turn one on in WooCommerce → Settings → Payments.",
    );
  }
  const paymentKind: CheckoutPaymentKind | "mock" = mockPayment
    ? "mock"
    : selected!.kind;
  const billing = details.billingSameAsShipping
    ? { ...details.shipping, email: details.billing.email || details.shipping.email, phone: details.billing.phone || details.shipping.phone }
    : details.billing;
  const cart = await updateStoreCustomer({
    shipping: details.shipping,
    billing,
  });

  if (!cart.items.length) {
    throw new Error("Your cart is empty.");
  }
  if (cart.needsShipping && !cart.shippingRates.some((rate) => rate.selected)) {
    throw new Error("Select a shipping method.");
  }

  await abandonPendingIfStale(cart.cartHash);

  const existing = await getPendingCheckout();
  if (existing && existing.cartHash === cart.cartHash) {
    const order = await getOrder(existing.orderId);
    const orderOk =
      order.status !== "cancelled" && order.status !== "failed";
    if (mockPayment && orderOk && isMockPaymentIntentId(existing.paymentIntentId)) {
      return {
        orderId: existing.orderId,
        orderKey: existing.orderKey,
        clientSecret: existing.paymentIntentId,
        amount: Number(order.total) || cart.totals.total,
        currency: order.currency || cart.totals.currency,
        email: billing.email,
        cart,
        mockPayment: true,
        paymentKind: "mock",
      };
    }
    if (
      !mockPayment &&
      orderOk &&
      (paymentKind === "paypal" ||
        paymentKind === "afterpay" ||
        paymentKind === "stripe") &&
      !existing.paymentIntentId.startsWith("pi_")
    ) {
      return {
        orderId: existing.orderId,
        orderKey: existing.orderKey,
        clientSecret: "",
        amount: Number(order.total) || cart.totals.total,
        currency: order.currency || cart.totals.currency,
        email: billing.email,
        cart,
        paymentKind,
        paymentUrl: wooPayUrl(existing.orderId, existing.orderKey),
      };
    }
  }

  const pending = await createPendingOrderFromCart(cart, {
    mockPayment,
    paymentMethod: selected?.wooId,
    paymentMethodTitle: selected?.title,
  });

  if (mockPayment) {
    const paymentIntentId = mockPaymentIntentId(pending.orderId);
    await setPendingCheckout({
      orderId: pending.orderId,
      orderKey: pending.orderKey,
      paymentIntentId,
      cartHash: cart.cartHash,
    });
    return {
      orderId: pending.orderId,
      orderKey: pending.orderKey,
      clientSecret: paymentIntentId,
      amount: pending.total,
      currency: pending.currency,
      email: billing.email,
      cart,
      mockPayment: true,
      paymentKind: "mock",
    };
  }

  const paymentUrl = wooPayUrl(pending.orderId, pending.orderKey);
  await setPendingCheckout({
    orderId: pending.orderId,
    orderKey: pending.orderKey,
    paymentIntentId: `${paymentKind}:${pending.orderId}`,
    cartHash: cart.cartHash,
  });
  return {
    orderId: pending.orderId,
    orderKey: pending.orderKey,
    clientSecret: "",
    amount: pending.total,
    currency: pending.currency,
    email: billing.email,
    cart,
    paymentKind,
    paymentUrl,
  };
}

export async function completeCheckoutAction(
  payload: CompleteCheckoutPayload,
): Promise<CreateOrderResult> {
  const orderId = payload.orderId.trim();
  const paymentIntentId = payload.paymentIntentId.trim();
  const orderKey = payload.orderKey.trim();

  if (!orderId || !paymentIntentId) {
    throw new Error("Payment confirmation is incomplete.");
  }

  if (isMockPaymentEnabled() && isMockPaymentIntentId(paymentIntentId)) {
    const pending = await getPendingCheckout();
    if (
      !pending ||
      pending.orderId !== orderId ||
      pending.paymentIntentId !== paymentIntentId
    ) {
      throw new Error("Payment confirmation is incomplete.");
    }
    if (orderKey && pending.orderKey && pending.orderKey !== orderKey) {
      throw new Error("Payment does not match this order.");
    }
    const paid = await markOrderPaid(orderId, paymentIntentId);
    try {
      await clearStoreCart();
    } catch {
      // Cart clear is best-effort after payment.
    }
    await setPendingCheckout(null);
    return { ...paid, orderKey: paid.orderKey || orderKey || "" };
  }

  const stripe = requireStripe();
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const wooOrderId = intent.metadata?.woo_order_id;
  const metadataKey = intent.metadata?.order_key || "";

  if (wooOrderId !== orderId) {
    throw new Error("Payment does not match this order.");
  }
  if (orderKey && metadataKey && metadataKey !== orderKey) {
    throw new Error("Payment does not match this order.");
  }
  if (intent.status !== "succeeded") {
    throw new Error("Payment has not succeeded yet.");
  }

  const order = await getOrder(orderId);
  if (
    !stripeAmountMatches(
      order.total || 0,
      order.currency || "",
      intent.amount,
      intent.currency,
    )
  ) {
    throw new Error("Payment amount does not match the order.");
  }

  const paid = await markOrderPaid(orderId, intent.id);
  try {
    await clearStoreCart();
  } catch {
    // Cart clear is best-effort after payment.
  }
  await setPendingCheckout(null);
  return { ...paid, orderKey: paid.orderKey || orderKey || order.order_key || "" };
}
