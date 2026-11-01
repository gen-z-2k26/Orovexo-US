"use server";

import { headers } from "next/headers";
import {
  cancelUnpaidOrder,
  createPendingOrderFromCart,
  getCountries,
  getDefaultCountry,
  getEnabledCheckoutMethods,
  getOrder,
  markOrderPaid,
} from "@/lib/api";
import { captureAfterpayPayment, createAfterpayCheckout } from "@/lib/afterpay";
import { capturePayPalOrder, createPayPalOrder } from "@/lib/paypal";
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
  toStripeAmount,
} from "@/lib/stripe";
import { stripeShippingParams } from "@/lib/stripe-address";
import type {
  Address,
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

async function requestOrigin() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const proto =
    headerList.get("x-forwarded-proto") ||
    (host.includes("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "";
}

async function createCardPaymentIntent(input: {
  orderId: string;
  orderKey: string;
  amount: number;
  currency: string;
  email: string;
  shipping: Address;
  existingIntentId?: string;
}) {
  const stripe = requireStripe();
  const amount = toStripeAmount(input.amount, input.currency);
  const currency = input.currency.trim().toLowerCase();
  const metadata = {
    woo_order_id: input.orderId,
    order_key: input.orderKey,
  };
  const shipping = stripeShippingParams(input.shipping);

  if (input.existingIntentId?.startsWith("pi_")) {
    try {
      const existing = await stripe.paymentIntents.retrieve(input.existingIntentId);
      if (
        existing.status !== "canceled" &&
        existing.client_secret &&
        existing.metadata?.woo_order_id === input.orderId
      ) {
        if (existing.status === "succeeded") return existing;
        return await stripe.paymentIntents.update(existing.id, {
          amount,
          currency,
          metadata,
          receipt_email: input.email || undefined,
          shipping,
        });
      }
    } catch {
      // Create a new card intent below.
    }
  }

  return stripe.paymentIntents.create({
    amount,
    currency,
    allowed_payment_method_types: ["card"],
    metadata,
    receipt_email: input.email || undefined,
    shipping,
  });
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
    if (!mockPayment && orderOk && paymentKind !== "mock") {
      return beginProviderPayment({
        kind: paymentKind,
        orderId: existing.orderId,
        orderKey: existing.orderKey,
        amount: Number(order.total) || cart.totals.total,
        currency: order.currency || cart.totals.currency,
        email: billing.email,
        shipping: cart.shippingAddress,
        billing,
        cart,
        existingRef: existing.paymentIntentId,
      });
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

  if (paymentKind === "mock") {
    throw new Error("Could not start checkout.");
  }
  return beginProviderPayment({
    kind: paymentKind,
    orderId: pending.orderId,
    orderKey: pending.orderKey,
    amount: pending.total,
    currency: pending.currency,
    email: billing.email,
    shipping: cart.shippingAddress,
    billing,
    cart,
  });
}

async function beginProviderPayment(input: {
  kind: CheckoutPaymentKind;
  orderId: string;
  orderKey: string;
  amount: number;
  currency: string;
  email: string;
  shipping: Address;
  billing: Address;
  cart: StoreCart;
  existingRef?: string;
}): Promise<CheckoutSessionResult> {
  const base = {
    orderId: input.orderId,
    orderKey: input.orderKey,
    amount: input.amount,
    currency: input.currency,
    email: input.email,
    cart: input.cart,
    paymentKind: input.kind,
  };

  if (input.kind === "paypal") {
    const paypalOrderId = await createPayPalOrder({
      orderId: input.orderId,
      amount: input.amount,
      currency: input.currency,
    });
    await setPendingCheckout({
      orderId: input.orderId,
      orderKey: input.orderKey,
      paymentIntentId: `paypal:${paypalOrderId}`,
      cartHash: input.cart.cartHash,
    });
    return { ...base, clientSecret: paypalOrderId };
  }

  if (input.kind === "afterpay") {
    const origin = await requestOrigin();
    const confirm = new URL(`/order/${input.orderId}`, origin || "http://localhost:3000");
    confirm.searchParams.set("key", input.orderKey);
    confirm.searchParams.set("email", input.email);
    const cancel = new URL("/checkout", origin || "http://localhost:3000");
    cancel.searchParams.set("afterpay", "cancel");
    const checkout = await createAfterpayCheckout({
      orderId: input.orderId,
      amount: input.amount,
      currency: input.currency,
      email: input.email,
      shipping: input.shipping,
      billing: input.billing,
      confirmUrl: confirm.toString(),
      cancelUrl: cancel.toString(),
    });
    await setPendingCheckout({
      orderId: input.orderId,
      orderKey: input.orderKey,
      paymentIntentId: `afterpay:${checkout.token}`,
      cartHash: input.cart.cartHash,
    });
    return {
      ...base,
      clientSecret: checkout.token,
      redirectUrl: checkout.redirectUrl,
    };
  }

  const intent = await createCardPaymentIntent({
    orderId: input.orderId,
    orderKey: input.orderKey,
    amount: input.amount,
    currency: input.currency,
    email: input.email,
    shipping: input.shipping,
    existingIntentId: input.existingRef,
  });
  if (!intent.client_secret) {
    throw new Error("Could not start Stripe payment.");
  }
  await setPendingCheckout({
    orderId: input.orderId,
    orderKey: input.orderKey,
    paymentIntentId: intent.id,
    cartHash: input.cart.cartHash,
  });
  return { ...base, clientSecret: intent.client_secret };
}

async function finishPaid(
  orderId: string,
  orderKey: string,
  transactionId: string,
  kind: CheckoutPaymentKind,
) {
  const methods = await getEnabledCheckoutMethods();
  const method = methods.find((entry) => entry.kind === kind);
  const paid = await markOrderPaid(orderId, transactionId, {
    paymentMethod: method?.wooId,
    paymentMethodTitle: method?.title,
  });
  try {
    await clearStoreCart();
  } catch {
    // Cart clear is best-effort after payment.
  }
  await setPendingCheckout(null);
  return { ...paid, orderKey: paid.orderKey || orderKey || "" };
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

  const provider = payload.provider;

  if (provider === "paypal") {
    const captured = await capturePayPalOrder(paymentIntentId);
    if (captured.orderId && captured.orderId !== orderId) {
      throw new Error("Payment does not match this order.");
    }
    const order = await getOrder(orderId);
    if (Math.abs(captured.amount - Number(order.total || 0)) > 0.05) {
      throw new Error("Payment amount does not match the order.");
    }
    return finishPaid(orderId, orderKey, captured.captureId, "paypal");
  }

  if (provider === "afterpay") {
    const captured = await captureAfterpayPayment(paymentIntentId, orderId);
    if (captured.orderId && captured.orderId !== orderId) {
      throw new Error("Payment does not match this order.");
    }
    const order = await getOrder(orderId);
    if (
      captured.amount > 0 &&
      Math.abs(captured.amount - Number(order.total || 0)) > 0.05
    ) {
      throw new Error("Payment amount does not match the order.");
    }
    return finishPaid(orderId, orderKey, captured.paymentId, "afterpay");
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

  return finishPaid(orderId, orderKey, intent.id, "stripe");
}
