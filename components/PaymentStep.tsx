"use client";

import { useState, type FormEvent } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { completeCheckoutAction } from "@/app/actions/checkout";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store-context";
import type { CreateOrderResult } from "@/lib/types";

let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}

export type PaymentStepProps = {
  amount: number;
  currency: string;
  clientSecret: string;
  orderId: string;
  orderKey: string;
  email: string;
  mockPayment?: boolean;
  onPaid: (order: CreateOrderResult) => void;
  onError: (message: string) => void;
};

function PaymentForm({
  amount,
  orderId,
  orderKey,
  email,
  onPaid,
  onError,
}: Omit<PaymentStepProps, "clientSecret" | "currency">) {
  const stripe = useStripe();
  const elements = useElements();
  const { settings } = useStore();
  const [submitting, setSubmitting] = useState(false);
  const [pendingIntentId, setPendingIntentId] = useState<string | null>(null);

  async function finalize(paymentIntentId: string) {
    const result = await completeCheckoutAction({
      orderId,
      orderKey,
      paymentIntentId,
    });
    onPaid(result);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    try {
      if (pendingIntentId) {
        await finalize(pendingIntentId);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order/${orderId}?key=${encodeURIComponent(orderKey)}&email=${encodeURIComponent(email)}`,
          receipt_email: email,
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || "Payment could not be completed.");
        return;
      }

      if (!paymentIntent?.id || paymentIntent.status !== "succeeded") {
        onError("Payment is still processing. Please wait and try again.");
        return;
      }

      setPendingIntentId(paymentIntent.id);
      try {
        await finalize(paymentIntent.id);
      } catch (finalizeError) {
        const message =
          finalizeError instanceof Error
            ? finalizeError.message
            : "Payment succeeded, but the order could not be marked paid. Retry without charging again.";
        onError(message);
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Payment could not be completed.";
      onError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: "tabs" }} />
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || !elements || submitting}
      >
        {submitting
          ? pendingIntentId
            ? "Confirming order..."
            : "Processing payment..."
          : pendingIntentId
            ? "Retry order confirmation"
            : `Pay ${formatPrice(amount, settings)}`}
      </Button>
    </form>
  );
}

function MockPaymentForm({
  amount,
  orderId,
  orderKey,
  clientSecret,
  onPaid,
  onError,
}: Pick<
  PaymentStepProps,
  "amount" | "orderId" | "orderKey" | "clientSecret" | "onPaid" | "onError"
>) {
  const { settings } = useStore();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await completeCheckoutAction({
        orderId,
        orderKey,
        paymentIntentId: clientSecret,
      });
      onPaid(result);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Could not complete the development checkout.";
      onError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
        Stripe is skipped for local development. This places the WooCommerce
        order as paid with no charge.
      </p>
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting
          ? "Confirming order..."
          : `Place order ${formatPrice(amount, settings)} (dev)`}
      </Button>
    </form>
  );
}

export function PaymentStep(props: PaymentStepProps) {
  if (props.mockPayment) {
    return (
      <MockPaymentForm
        amount={props.amount}
        orderId={props.orderId}
        orderKey={props.orderKey}
        clientSecret={props.clientSecret}
        onPaid={props.onPaid}
        onError={props.onError}
      />
    );
  }

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
        Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY or set
        SKIP_STRIPE_PAYMENT=yes in .env.local for local checkout.
      </p>
    );
  }

  return (
    <Elements
      stripe={getStripePromise()}
      options={{
        clientSecret: props.clientSecret,
        appearance: { theme: "stripe" },
      }}
    >
      <PaymentForm
        amount={props.amount}
        orderId={props.orderId}
        orderKey={props.orderKey}
        email={props.email}
        onPaid={props.onPaid}
        onError={props.onError}
      />
    </Elements>
  );
}
