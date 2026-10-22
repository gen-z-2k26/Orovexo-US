"use server";

import {
  createPendingOrder,
  getOrder,
  markOrderPaid,
} from "@/lib/api";
import {
  getStripe,
  isStripeConfigured,
  stripeAmountMatches,
  toStripeAmount,
} from "@/lib/stripe";
import type {
  CheckoutPayload,
  CheckoutSessionResult,
  CompleteCheckoutPayload,
  CreateOrderResult,
} from "@/lib/types";

function requireStripe() {
  if (!isStripeConfigured()) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local.",
    );
  }
  return getStripe();
}

export async function createCheckoutSessionAction(
  payload: CheckoutPayload,
): Promise<CheckoutSessionResult> {
  const stripe = requireStripe();
  const pending = await createPendingOrder(payload);
  const amount = toStripeAmount(pending.total, pending.currency);

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: pending.currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
    receipt_email: payload.email,
    metadata: {
      woo_order_id: pending.orderId,
    },
  });

  if (!intent.client_secret) {
    throw new Error("Stripe did not return a client secret.");
  }

  return {
    orderId: pending.orderId,
    clientSecret: intent.client_secret,
    amount: pending.total,
    currency: pending.currency,
  };
}

export async function completeCheckoutAction(
  payload: CompleteCheckoutPayload,
): Promise<CreateOrderResult> {
  const stripe = requireStripe();
  const orderId = payload.orderId.trim();
  const paymentIntentId = payload.paymentIntentId.trim();

  if (!orderId || !paymentIntentId) {
    throw new Error("Payment confirmation is incomplete.");
  }

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const wooOrderId = intent.metadata?.woo_order_id;

  if (wooOrderId !== orderId) {
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

  return markOrderPaid(orderId, intent.id);
}
