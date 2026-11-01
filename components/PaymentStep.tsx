"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { completeCheckoutAction } from "@/app/actions/checkout";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store-context";
import { getStripeJs, getStripePublishableKey } from "@/lib/stripe-browser";
import { stripeBillingDetails } from "@/lib/stripe-address";
import type {
  Address,
  CheckoutPaymentKind,
  CreateOrderResult,
} from "@/lib/types";

export type PaymentStepProps = {
  amount: number;
  currency: string;
  clientSecret: string;
  orderId: string;
  orderKey: string;
  email: string;
  shipping: Address;
  billing: Address;
  mockPayment?: boolean;
  paymentKind?: CheckoutPaymentKind | "mock";
  redirectUrl?: string;
  onPaid: (order: CreateOrderResult) => void;
  onError: (message: string) => void;
};

function SecureNote({ children }: { children: string }) {
  return (
    <p className="flex items-start gap-2 text-xs leading-relaxed text-foreground/75">
      <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

function Unavailable({ children }: { children: string }) {
  return (
    <p className="rounded-2xl border border-foreground/15 bg-muted px-4 py-4 text-sm font-medium text-foreground">
      {children}
    </p>
  );
}

export function PaymentFormSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading payment form">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

function MockPaymentForm({
  amount,
  currency,
  orderId,
  orderKey,
  clientSecret,
  onPaid,
  onError,
}: Pick<
  PaymentStepProps,
  | "amount"
  | "currency"
  | "orderId"
  | "orderKey"
  | "clientSecret"
  | "onPaid"
  | "onError"
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
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting
          ? "Confirming order..."
          : `Place order ${formatPrice(amount, settings, currency)} (dev)`}
      </Button>
    </form>
  );
}

function StripePaymentForm({
  amount,
  currency,
  orderId,
  orderKey,
  email,
  billing,
  onPaid,
  onError,
}: Omit<
  PaymentStepProps,
  "clientSecret" | "mockPayment" | "paymentKind" | "shipping"
>) {
  const stripe = useStripe();
  const elements = useElements();
  const { settings } = useStore();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const returnUrl = new URL(
        `/order/${encodeURIComponent(orderId)}`,
        window.location.origin,
      );
      returnUrl.searchParams.set("key", orderKey);
      returnUrl.searchParams.set("email", email);

      const billingDetails = stripeBillingDetails(billing, email);
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl.toString(),
          receipt_email: email || undefined,
          payment_method_data: {
            billing_details: billingDetails,
          },
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || "Payment could not be completed.");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        const result = await completeCheckoutAction({
          orderId,
          orderKey,
          paymentIntentId: paymentIntent.id,
        });
        onPaid(result);
        return;
      }

      if (paymentIntent?.status === "processing") {
        onError("Payment is still processing. Check your email for confirmation.");
        return;
      }

      onError("Payment was not completed. Try again.");
    } catch (submitError) {
      onError(
        submitError instanceof Error
          ? submitError.message
          : "Payment could not be completed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: "tabs",
          wallets: { applePay: "never", googlePay: "never" },
          defaultValues: {
            billingDetails: stripeBillingDetails(billing, email),
          },
          fields: {
            billingDetails: "never",
          },
        }}
      />
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || !elements || submitting}
      >
        {submitting
          ? "Paying..."
          : `Pay ${formatPrice(amount, settings, currency)}`}
      </Button>
      <SecureNote>
        Card numbers are encrypted by Stripe and are not stored on this site.
      </SecureNote>
    </form>
  );
}

function PayPalPayment({
  amount,
  currency,
  orderId,
  orderKey,
  clientSecret,
  onPaid,
  onError,
}: Pick<
  PaymentStepProps,
  "amount" | "currency" | "orderId" | "orderKey" | "clientSecret" | "onPaid" | "onError"
>) {
  const slot = useRef<HTMLDivElement>(null);
  const onPaidRef = useRef(onPaid);
  const onErrorRef = useRef(onError);
  const { settings } = useStore();
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() || "";
  onPaidRef.current = onPaid;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!clientId || !slot.current) return;
    let cancelled = false;

    function render() {
      const paypal = (
        window as Window & {
          paypal?: {
            Buttons: (options: {
              createOrder: () => Promise<string>;
              onApprove: () => Promise<void>;
              onError: (error: { message?: string }) => void;
              onCancel: () => void;
            }) => { render: (target: HTMLElement) => Promise<void> };
          };
        }
      ).paypal;
      if (!paypal || !slot.current || cancelled) return;
      slot.current.replaceChildren();
      void paypal
        .Buttons({
          createOrder: () => Promise.resolve(clientSecret),
          onApprove: async () => {
            const result = await completeCheckoutAction({
              orderId,
              orderKey,
              paymentIntentId: clientSecret,
              provider: "paypal",
            });
            onPaidRef.current(result);
          },
          onCancel: () => {
            onErrorRef.current("PayPal payment was cancelled.");
          },
          onError: (error) => {
            onErrorRef.current(error.message || "PayPal could not be completed.");
          },
        })
        .render(slot.current);
    }

    if (
      (
        window as Window & {
          paypal?: unknown;
        }
      ).paypal
    ) {
      render();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture`;
    script.async = true;
    script.onload = () => {
      if (!cancelled) render();
    };
    document.body.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, [clientId, clientSecret, currency, orderId, orderKey]);

  if (!clientId) {
    return <Unavailable>PayPal is not available right now.</Unavailable>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-foreground">
        Pay {formatPrice(amount, settings, currency)} with PayPal.
      </p>
      <div
        ref={slot}
        className="min-h-12 rounded-2xl border border-foreground/15 bg-card p-3"
      />
      <SecureNote>
        You will approve this payment in PayPal. We only receive the result.
      </SecureNote>
    </div>
  );
}

function AfterpayPayment({
  amount,
  currency,
  redirectUrl,
}: Pick<PaymentStepProps, "amount" | "currency" | "redirectUrl">) {
  const { settings } = useStore();
  if (!redirectUrl) {
    return <Unavailable>Afterpay is not available right now.</Unavailable>;
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground/80">
        You will complete {formatPrice(amount, settings, currency)} on Afterpay,
        then return here to confirm the order.
      </p>
      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={() => {
          window.location.assign(redirectUrl);
        }}
      >
        Continue to Afterpay
      </Button>
      <SecureNote>
        Afterpay collects the installment details. This store never sees them.
      </SecureNote>
    </div>
  );
}

export function PaymentStep(props: PaymentStepProps) {
  if (props.mockPayment) {
    return (
      <MockPaymentForm
        amount={props.amount}
        currency={props.currency}
        orderId={props.orderId}
        orderKey={props.orderKey}
        clientSecret={props.clientSecret}
        onPaid={props.onPaid}
        onError={props.onError}
      />
    );
  }

  if (props.paymentKind === "paypal") {
    return (
      <PayPalPayment
        amount={props.amount}
        currency={props.currency}
        orderId={props.orderId}
        orderKey={props.orderKey}
        clientSecret={props.clientSecret}
        onPaid={props.onPaid}
        onError={props.onError}
      />
    );
  }

  if (props.paymentKind === "afterpay") {
    return (
      <AfterpayPayment
        amount={props.amount}
        currency={props.currency}
        redirectUrl={props.redirectUrl}
      />
    );
  }

  if (props.paymentKind !== "stripe") {
    return <Unavailable>This payment method is not available.</Unavailable>;
  }

  if (!getStripePublishableKey() || !props.clientSecret) {
    return <Unavailable>Card payment is not available right now.</Unavailable>;
  }

  return (
    <Elements
      stripe={getStripeJs()}
      options={{
        clientSecret: props.clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            borderRadius: "12px",
            fontFamily: "inherit",
          },
        },
      }}
    >
      <StripePaymentForm
        amount={props.amount}
        currency={props.currency}
        orderId={props.orderId}
        orderKey={props.orderKey}
        email={props.email}
        billing={props.billing}
        onPaid={props.onPaid}
        onError={props.onError}
      />
    </Elements>
  );
}
