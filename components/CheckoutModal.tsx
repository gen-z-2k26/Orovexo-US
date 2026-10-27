"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StoreImage } from "@/components/StoreImage";
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
import { SelectField } from "@/components/SelectField";
import { PaymentFormSkeleton, PaymentStep } from "@/components/PaymentStep";
import { useCartStore } from "@/lib/cart-store";
import { useStore } from "@/lib/store-context";
import { formatPrice } from "@/lib/format";
import { emptyAddress, emptyStoreCart } from "@/lib/api/map-cart";
import {
  createCheckoutSessionAction,
  getCheckoutOptionsAction,
} from "@/app/actions/checkout";
import {
  selectShippingRateAction,
  updateCustomerAction,
} from "@/app/actions/cart";
import type {
  Address,
  CheckoutSessionResult,
  CountryOption,
  StoreCart,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast-store";

type Step = "details" | "payment";

function addressFromCart(source: Address, fallbackCountry: string): Address {
  return {
    ...emptyAddress(),
    ...source,
    country: source.country || fallbackCountry,
  };
}

export function CheckoutModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { settings } = useStore();
  const cart = useCartStore((state) => state.cart);
  const setCart = useCartStore((state) => state.setCart);
  const [step, setStep] = useState<Step>("details");
  const [shipping, setShipping] = useState<Address>(emptyAddress());
  const [billing, setBilling] = useState<Address>(emptyAddress());
  const [same, setSame] = useState(true);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<CheckoutSessionResult | null>(null);
  const [sessionError, setSessionError] = useState("");
  const [mockPayment, setMockPayment] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getCheckoutOptionsAction()
      .then((options) => {
        if (cancelled) return;
        setCart(options.cart);
        setCountries(options.countries);
        setMockPayment(options.mockPayment);
        setShipping(addressFromCart(options.cart.shippingAddress, options.defaultCountry));
        setBilling(addressFromCart(options.cart.billingAddress, options.defaultCountry));
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setErrors({
            form: error instanceof Error ? error.message : "Could not load checkout.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, setCart]);

  function reset() {
    setStep("details");
    setErrors({});
    setSubmitting(false);
    setSession(null);
    setSessionError("");
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!shipping.firstName.trim()) next.firstName = "First name is required.";
    if (!shipping.lastName.trim()) next.lastName = "Last name is required.";
    if (!shipping.address1.trim()) next.address1 = "Street address is required.";
    if (!shipping.city.trim()) next.city = "City is required.";
    if (!shipping.postcode.trim()) next.postcode = "Postcode is required.";
    if (!shipping.country.trim()) next.country = "Country is required.";
    const email = (same ? shipping.email : billing.email).trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function syncAddress() {
    const nextBilling = same
      ? { ...shipping, email: shipping.email || billing.email, phone: shipping.phone || billing.phone }
      : billing;
    const next = await updateCustomerAction({
      shipping,
      billing: nextBilling,
    });
    setCart(next);
    return next;
  }

  async function continueToPayment() {
    if (!cart.items.length || !validate()) return;
    setSubmitting(true);
    setSessionError("");
    setSession(null);
    setStep("payment");
    try {
      const nextCart = await syncAddress();
      if (nextCart.needsShipping && !nextCart.shippingRates.some((rate) => rate.selected)) {
        setErrors({ form: "Select a shipping method." });
        toast({
          title: "Select a shipping method",
          variant: "error",
        });
        setStep("details");
        setSubmitting(false);
        return;
      }
      const nextSession = await createCheckoutSessionAction({
        shipping,
        billing: same ? { ...shipping, email: shipping.email } : billing,
        billingSameAsShipping: same,
      });
      setCart(nextSession.cart);
      setSession(nextSession);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start checkout.";
      setSessionError(message);
      setErrors({ form: message });
      setStep("details");
      toast({ title: "Could not start checkout", description: message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function chooseRate(packageId: number, rateId: string) {
    try {
      setCart(await selectShippingRateAction({ packageId, rateId }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not select shipping.";
      setErrors({ form: message });
      toast({ title: "Could not select shipping", description: message, variant: "error" });
    }
  }

  const countryOptions = countries.map((country) => ({
    value: country.code,
    label: country.name,
  }));
  const selectedCountry = countries.find((country) => country.code === shipping.country);
  const stateOptions = (selectedCountry?.states ?? []).map((state) => ({
    value: state.code,
    label: state.name,
  }));

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
              {step === "payment" ? "Payment" : "Checkout"}
            </DialogTitle>
            <DialogDescription className="text-pretty">
              {step === "payment"
                ? mockPayment
                  ? "Confirm the order. No Stripe charge in local skip mode."
                  : "Enter your card details to pay this order."
                : mockPayment
                  ? "Enter your delivery details, then continue to the next step."
                  : "Enter your delivery details, then continue to card payment."}
            </DialogDescription>
            <p className="text-xs font-medium tracking-wide text-muted-foreground">
              {step === "details" ? "Step 1 of 2 · Delivery" : "Step 2 of 2 · Payment"}
            </p>
          </DialogHeader>

          {step === "details" ? (
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void continueToPayment();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="first-name"
                  label="First name"
                  value={shipping.firstName}
                  error={errors.firstName}
                  onChange={(value) => setShipping({ ...shipping, firstName: value })}
                />
                <Field
                  id="last-name"
                  label="Last name"
                  value={shipping.lastName}
                  error={errors.lastName}
                  onChange={(value) => setShipping({ ...shipping, lastName: value })}
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  value={same ? shipping.email : billing.email}
                  error={errors.email}
                  onChange={(value) => {
                    if (same) setShipping({ ...shipping, email: value });
                    else setBilling({ ...billing, email: value });
                  }}
                />
                <Field
                  id="phone"
                  label="Phone"
                  value={shipping.phone}
                  onChange={(value) => setShipping({ ...shipping, phone: value })}
                />
                <Field
                  className="sm:col-span-2"
                  id="address1"
                  label="Address"
                  value={shipping.address1}
                  error={errors.address1}
                  onChange={(value) => setShipping({ ...shipping, address1: value })}
                />
                <Field
                  id="city"
                  label="City"
                  value={shipping.city}
                  error={errors.city}
                  onChange={(value) => setShipping({ ...shipping, city: value })}
                />
                <Field
                  id="postcode"
                  label="Postcode"
                  value={shipping.postcode}
                  error={errors.postcode}
                  onChange={(value) => setShipping({ ...shipping, postcode: value })}
                />
                {countryOptions.length ? (
                  <SelectField
                    id="country"
                    label="Country"
                    value={shipping.country}
                    options={countryOptions}
                    onChange={(value) =>
                      setShipping({ ...shipping, country: value, state: "" })
                    }
                  />
                ) : (
                  <Field
                    id="country"
                    label="Country"
                    value={shipping.country}
                    error={errors.country}
                    onChange={(value) => setShipping({ ...shipping, country: value })}
                  />
                )}
                {stateOptions.length ? (
                  <SelectField
                    id="state"
                    label="State"
                    value={shipping.state}
                    options={stateOptions}
                    onChange={(value) => setShipping({ ...shipping, state: value })}
                  />
                ) : (
                  <Field
                    id="state"
                    label="State / region"
                    value={shipping.state}
                    onChange={(value) => setShipping({ ...shipping, state: value })}
                  />
                )}
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={same}
                  onChange={(event) => setSame(event.target.checked)}
                />
                Billing address is the same as shipping
              </label>

              {cart.needsShipping && cart.shippingRates.length > 0 ? (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Shipping</legend>
                  {cart.shippingRates.map((rate) => (
                    <label
                      key={`${rate.packageId}-${rate.rateId}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="shipping-rate"
                          checked={rate.selected}
                          onChange={() => void chooseRate(rate.packageId, rate.rateId)}
                        />
                        {rate.name}
                      </span>
                      <span className="tabular-nums">
                        {formatPrice(rate.price, settings)}
                      </span>
                    </label>
                  ))}
                </fieldset>
              ) : null}

              <CartTotalsSummary cart={cart} />

              {errors.form ? (
                <p className="text-sm text-destructive">{errors.form}</p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!cart.items.length || submitting}
              >
                {submitting
                  ? mockPayment
                    ? "Preparing order..."
                    : "Preparing payment..."
                  : mockPayment
                    ? "Continue (dev, no charge)"
                    : "Continue to payment"}
              </Button>
            </form>
          ) : null}

          {step === "payment" ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm">
                <span>Order total</span>
                <span className="tabular-nums font-medium">
                  {formatPrice(
                    session?.amount ?? cart.totals.total,
                    settings,
                  )}
                </span>
              </div>
              {sessionError && !session ? (
                <p className="text-sm text-destructive">{sessionError}</p>
              ) : null}
              {!session ? (
                <PaymentFormSkeleton />
              ) : (
                <PaymentStep
                  amount={session.amount}
                  currency={session.currency}
                  clientSecret={session.clientSecret}
                  orderId={session.orderId}
                  orderKey={session.orderKey}
                  email={session.email}
                  mockPayment={session.mockPayment}
                  onPaid={(result) => {
                    setCart(emptyStoreCart());
                    onOpenChange(false);
                    reset();
                    toast({
                      title: "Order placed",
                      description: `Order ${result.orderId} is confirmed.`,
                    });
                    router.push(
                      `/order/${result.orderId}?key=${encodeURIComponent(result.orderKey)}&email=${encodeURIComponent(result.email)}`,
                    );
                  }}
                  onError={(message) => {
                    setErrors({ form: message });
                    toast({
                      title: "Payment could not be completed",
                      description: message,
                      variant: "error",
                    });
                  }}
                />
              )}
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
                disabled={submitting}
              >
                Back to details
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function CartTotalsSummary({ cart }: { cart: StoreCart }) {
  const { settings } = useStore();
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4 sm:p-5">
      <ul className="max-h-48 space-y-3 overflow-y-auto pr-1">
        {cart.items.map((item) => (
          <li key={item.key} className="flex items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-background">
              <StoreImage src={item.image} alt="" sizes="48px" />
            </div>
            <div className="min-w-0 flex-1">
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
      <div className="space-y-1 border-t border-border pt-3 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatPrice(cart.totals.subtotal, settings)}</span>
        </div>
        {cart.totals.discount > 0 ? (
          <div className="flex justify-between">
            <span>Discount</span>
            <span className="tabular-nums">
              -{formatPrice(cart.totals.discount, settings)}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="tabular-nums">{formatPrice(cart.totals.shipping, settings)}</span>
        </div>
        {cart.totals.tax > 0 ? (
          <div className="flex justify-between">
            <span>Tax</span>
            <span className="tabular-nums">{formatPrice(cart.totals.tax, settings)}</span>
          </div>
        ) : null}
        <div className="flex justify-between pt-1">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(cart.totals.total, settings)}</span>
        </div>
      </div>
    </div>
  );
}
