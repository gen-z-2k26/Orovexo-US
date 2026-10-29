"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { completeCheckoutAction } from "@/app/actions/checkout";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store-context";
import type { CheckoutPaymentKind, CreateOrderResult } from "@/lib/types";

export type PaymentStepProps = {
  amount: number;
  currency: string;
  clientSecret: string;
  orderId: string;
  orderKey: string;
  email: string;
  mockPayment?: boolean;
  paymentKind?: CheckoutPaymentKind | "mock";
  paymentUrl?: string;
  onPaid: (order: CreateOrderResult) => void;
  onError: (message: string) => void;
};

export function PaymentFormSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading payment form">
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

function methodLabel(kind?: CheckoutPaymentKind | "mock") {
  if (kind === "paypal") return "PayPal";
  if (kind === "afterpay") return "Afterpay";
  if (kind === "stripe") return "card payment";
  return "payment";
}

function RedirectPaymentForm({
  amount,
  currency,
  paymentKind,
  paymentUrl,
}: {
  amount: number;
  currency: string;
  paymentKind?: CheckoutPaymentKind | "mock";
  paymentUrl?: string;
}) {
  const { settings } = useStore();
  const label = methodLabel(paymentKind);

  if (!paymentUrl) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
        {label} is enabled in WooCommerce, but the pay link could not be created.
        Complete setup under WooCommerce → Settings → Payments.
      </p>
    );
  }

  return (
    <Button
      type="button"
      size="lg"
      className="w-full"
      onClick={() => {
        window.location.assign(paymentUrl);
      }}
    >
      Continue to {label} · {formatPrice(amount, settings, currency)}
    </Button>
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

  return (
    <RedirectPaymentForm
      amount={props.amount}
      currency={props.currency}
      paymentKind={props.paymentKind}
      paymentUrl={props.paymentUrl}
    />
  );
}
