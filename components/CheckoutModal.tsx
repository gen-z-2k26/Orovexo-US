"use client";

import { useEffect, useMemo, useState } from "react";
import { StoreImage } from "@/components/StoreImage";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentStep } from "@/components/PaymentStep";
import { getCartSubtotal, useCartStore } from "@/lib/cart-store";
import { useStore } from "@/lib/store-context";
import { formatPrice } from "@/lib/format";
import { useMotionEnabled } from "@/lib/use-motion-enabled";
import { durations, easings } from "@/lib/motion";
import { createCheckoutSessionAction } from "@/app/actions/checkout";
import type { CartItem, CheckoutSessionResult, CreateOrderResult } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = "details" | "payment" | "success";

const steps: { id: Step; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "payment", label: "Payment" },
  { id: "success", label: "Done" },
];

export function CheckoutModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings } = useStore();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const { enabled } = useMotionEnabled();

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<CreateOrderResult | null>(null);
  const [session, setSession] = useState<CheckoutSessionResult | null>(null);
  const [sessionError, setSessionError] = useState("");

  const amount = useMemo(() => getCartSubtotal(items), [items]);
  const activeStepIndex = steps.findIndex((entry) => entry.id === step);

  function reset() {
    setStep("details");
    setName("");
    setEmail("");
    setAddress("");
    setErrors({});
    setSubmitting(false);
    setOrder(null);
    setSession(null);
    setSessionError("");
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email.";
    }
    if (!address.trim() || address.trim().length < 8) {
      next.address = "Enter a full delivery address.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  useEffect(() => {
    if (step !== "payment" || session) return;

    let cancelled = false;
    setSubmitting(true);
    setSessionError("");

    createCheckoutSessionAction({
      name: name.trim(),
      email: email.trim(),
      address: address.trim(),
      items,
    })
      .then((next) => {
        if (!cancelled) setSession(next);
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Could not start checkout. Please try again.";
        if (!cancelled) {
          setSessionError(message);
          setErrors({ form: message });
        }
      })
      .finally(() => {
        if (!cancelled) setSubmitting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [address, email, items, name, session, step]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent
        data-lenis-prevent
        className="max-h-[90dvh] gap-0 overflow-y-auto overscroll-contain rounded-2xl p-0 sm:max-w-xl"
      >
        <div className="space-y-6 p-5 sm:p-7">
          <DialogHeader className="space-y-3 text-left">
            <DialogTitle className="font-display text-2xl">
              {step === "success" ? "Order confirmed" : "Checkout"}
            </DialogTitle>
            <DialogDescription className="text-pretty">
              {step === "success"
                ? "Your payment was received and the order is confirmed."
                : "Enter your details, review the summary, then pay with card."}
            </DialogDescription>
          </DialogHeader>

          <ol className="grid grid-cols-3 gap-2" aria-label="Checkout progress">
            {steps.map((entry, index) => {
              const complete = index < activeStepIndex || step === "success";
              const current = entry.id === step;
              return (
                <li
                  key={entry.id}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-center text-xs",
                    current || complete
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border bg-muted/40 text-muted-foreground",
                  )}
                >
                  <span className="tabular-nums">{index + 1}. </span>
                  {entry.label}
                </li>
              );
            })}
          </ol>

          {step === "details" ? (
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (!items.length) return;
                if (validate()) setStep("payment");
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="checkout-name">Full name</Label>
                  <Input
                    id="checkout-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    aria-invalid={Boolean(errors.name)}
                    placeholder="Jane Cooper"
                  />
                  {errors.name ? (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  ) : null}
                </div>

                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="checkout-email">Email</Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    placeholder="jane@example.com"
                  />
                  {errors.email ? (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkout-address">Delivery address</Label>
                <Input
                  id="checkout-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  autoComplete="street-address"
                  aria-invalid={Boolean(errors.address)}
                  placeholder="Street, city, postal code"
                />
                {errors.address ? (
                  <p className="text-xs text-destructive">{errors.address}</p>
                ) : null}
              </div>

              <OrderSummary items={items} amount={amount} />

              {errors.form ? (
                <p className="text-sm text-destructive">{errors.form}</p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!items.length}
              >
                Continue to payment
              </Button>
            </form>
          ) : null}

          {step === "payment" ? (
            <div className="space-y-5">
              <OrderSummary items={items} amount={session?.amount ?? amount} />
              {submitting && !session ? (
                <p className="rounded-xl border border-border bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
                  Preparing secure payment...
                </p>
              ) : null}
              {sessionError && !session ? (
                <p className="text-sm text-destructive">{sessionError}</p>
              ) : null}
              {session ? (
                <PaymentStep
                  amount={session.amount}
                  currency={session.currency}
                  clientSecret={session.clientSecret}
                  orderId={session.orderId}
                  email={email.trim()}
                  onPaid={(result) => {
                    setOrder(result);
                    clearCart();
                    setStep("success");
                  }}
                  onError={(message) => setErrors({ form: message })}
                />
              ) : null}
              {errors.form && session ? (
                <p className="text-sm text-destructive">{errors.form}</p>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setSession(null);
                  setSessionError("");
                  setStep("details");
                }}
                disabled={submitting && !sessionError}
              >
                Back to details
              </Button>
            </div>
          ) : null}

          {step === "success" && order ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-6 text-center">
                {enabled ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: Math.min(durations.base, 0.2),
                      ease: easings.standard,
                    }}
                    className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Check className="size-7" />
                  </motion.div>
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-7" />
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-lg tracking-tight">Thanks, {order.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Order{" "}
                    <span className="font-medium text-foreground tabular-nums">
                      {order.orderId}
                    </span>
                  </p>
                </div>
              </div>

              <OrderSummary items={order.items} amount={order.total} />

              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => {
                  onOpenChange(false);
                  reset();
                }}
              >
                Done
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderSummary({
  items,
  amount,
}: {
  items: CartItem[] | { name: string; quantity: number; price: number; image?: string }[];
  amount: number;
}) {
  const { settings } = useStore();
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm tracking-tight">Order summary</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {items.length} item{items.length === 1 ? "" : "s"}
        </p>
      </div>
      <ul className="max-h-48 space-y-3 overflow-y-auto pr-1">
        {items.map((item, index) => (
          <li
            key={`${item.name}-${item.quantity}-${item.price}-${index}`}
            className="flex items-center gap-3"
          >
            {"image" in item && item.image ? (
              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-background">
                <StoreImage src={item.image} alt="" sizes="48px" />
              </div>
            ) : (
              <div className="size-12 shrink-0 rounded-xl bg-background" />
            )}
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                Qty {item.quantity}
              </p>
            </div>
            <span className="shrink-0 text-sm font-medium tabular-nums">
              {formatPrice(item.price * item.quantity, settings)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-border pt-3 text-sm tracking-tight">
        <span>Total</span>
        <span className="tabular-nums">
          {formatPrice(amount, settings)}
        </span>
      </div>
    </div>
  );
}
