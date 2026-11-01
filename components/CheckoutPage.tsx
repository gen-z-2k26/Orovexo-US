"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StoreImage } from "@/components/StoreImage";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/SelectField";
import { PaymentBrandIcon } from "@/components/PaymentBrandIcon";
import { PaymentFormSkeleton, PaymentStep } from "@/components/PaymentStep";
import { iconsForCheckoutMethods } from "@/lib/checkout-icons";
import { useCartStore } from "@/lib/cart-store";
import { useStore } from "@/lib/store-context";
import { formatPrice } from "@/lib/format";
import { emptyAddress, emptyStoreCart } from "@/lib/api/map-cart";
import { pageContainer } from "@/lib/layout";
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
  CheckoutPaymentKind,
  CheckoutPaymentMethod,
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

export function CheckoutPage() {
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
  const [paymentMethods, setPaymentMethods] = useState<CheckoutPaymentMethod[]>(
    [],
  );
  const [paymentKind, setPaymentKind] = useState<CheckoutPaymentKind | "">("");

  useEffect(() => {
    let cancelled = false;
    getCheckoutOptionsAction()
      .then((options) => {
        if (cancelled) return;
        setCart(options.cart);
        setCountries(options.countries);
        setMockPayment(options.mockPayment);
        setPaymentMethods(options.paymentMethods);
        setPaymentKind((current) =>
          options.paymentMethods.some((method) => method.kind === current)
            ? current
            : options.paymentMethods[0]?.kind || "",
        );
        setShipping(
          addressFromCart(options.cart.shippingAddress, options.defaultCountry),
        );
        setBilling(
          addressFromCart(options.cart.billingAddress, options.defaultCountry),
        );
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setErrors({
            form:
              error instanceof Error
                ? error.message
                : "Could not load checkout.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [setCart]);

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
      ? {
          ...shipping,
          email: shipping.email || billing.email,
          phone: shipping.phone || billing.phone,
        }
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
      if (
        nextCart.needsShipping &&
        !nextCart.shippingRates.some((rate) => rate.selected)
      ) {
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
        paymentKind: paymentKind || undefined,
      });
      setCart(nextSession.cart);
      setSession(nextSession);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start checkout.";
      setSessionError(message);
      setErrors({ form: message });
      setStep("details");
      toast({
        title: "Could not start checkout",
        description: message,
        variant: "error",
      });
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
      toast({
        title: "Could not select shipping",
        description: message,
        variant: "error",
      });
    }
  }

  const countryOptions = countries.map((country) => ({
    value: country.code,
    label: country.name,
  }));
  const selectedCountry = countries.find(
    (country) => country.code === shipping.country,
  );
  const stateOptions = (selectedCountry?.states ?? []).map((state) => ({
    value: state.code,
    label: state.name,
  }));

  return (
    <main className={pageContainer("py-10 sm:py-14")}>
      <div className="mb-8 max-w-xl">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">
          {step === "details"
            ? "Step 1 of 2 · Delivery"
            : "Step 2 of 2 · Payment"}
        </p>
        <h1 className="font-display mt-2 text-4xl sm:text-5xl">
          {step === "payment" ? "Payment" : "Checkout"}
        </h1>
        <p className="mt-3 text-pretty text-muted-foreground">
          {step === "payment"
            ? mockPayment
              ? "Confirm the order. No charge in local skip mode."
              : `Pay with ${
                  paymentMethods.find((method) => method.kind === session?.paymentKind)
                    ?.title || "your selected method"
                }.`
            : "Enter your delivery details, then choose a payment method."}
        </p>
      </div>

      {!cart.items.length ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">Your cart is empty</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a product before checkout.
          </p>
          <Link
            href="/products"
            className={cn(buttonVariants({ variant: "outline" }), "mt-5")}
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
          <section className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-8">
            {step === "details" ? (
              <form
                className="min-w-0 space-y-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void continueToPayment();
                }}
              >
                <div className="grid min-w-0 gap-x-4 gap-y-5 sm:grid-cols-2">
                  <Field
                    id="first-name"
                    label="First name"
                    value={shipping.firstName}
                    error={errors.firstName}
                    onChange={(value) =>
                      setShipping({ ...shipping, firstName: value })
                    }
                  />
                  <Field
                    id="last-name"
                    label="Last name"
                    value={shipping.lastName}
                    error={errors.lastName}
                    onChange={(value) =>
                      setShipping({ ...shipping, lastName: value })
                    }
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
                    onChange={(value) =>
                      setShipping({ ...shipping, phone: value })
                    }
                  />
                  <Field
                    className="sm:col-span-2"
                    id="address1"
                    label="Address"
                    value={shipping.address1}
                    error={errors.address1}
                    onChange={(value) =>
                      setShipping({ ...shipping, address1: value })
                    }
                  />
                  <Field
                    id="city"
                    label="City"
                    value={shipping.city}
                    error={errors.city}
                    onChange={(value) =>
                      setShipping({ ...shipping, city: value })
                    }
                  />
                  <Field
                    id="postcode"
                    label="Postcode"
                    value={shipping.postcode}
                    error={errors.postcode}
                    onChange={(value) =>
                      setShipping({ ...shipping, postcode: value })
                    }
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
                      onChange={(value) =>
                        setShipping({ ...shipping, country: value })
                      }
                    />
                  )}
                  {stateOptions.length ? (
                    <SelectField
                      id="state"
                      label="State"
                      value={shipping.state}
                      options={stateOptions}
                      onChange={(value) =>
                        setShipping({ ...shipping, state: value })
                      }
                    />
                  ) : (
                    <Field
                      id="state"
                      label="State / region"
                      value={shipping.state}
                      onChange={(value) =>
                        setShipping({ ...shipping, state: value })
                      }
                    />
                  )}
                </div>

                <label className="flex min-w-0 items-start gap-2 text-sm leading-snug">
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
                            onChange={() =>
                              void chooseRate(rate.packageId, rate.rateId)
                            }
                          />
                          {rate.name}
                        </span>
                        <span className="tabular-nums">
                          {formatPrice(
                            rate.price,
                            settings,
                            cart.totals.currency,
                          )}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                ) : null}

                <PaymentMethodPicker
                  methods={paymentMethods}
                  value={paymentKind}
                  onChange={setPaymentKind}
                />

                {errors.form ? (
                  <p className="text-sm text-destructive">{errors.form}</p>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={
                    !cart.items.length || submitting || (!mockPayment && !paymentKind)
                  }
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
            ) : (
              <div className="space-y-5">
                <PaymentMethodPicker
                  methods={paymentMethods.filter(
                    (method) => method.kind === (session?.paymentKind || paymentKind),
                  )}
                  value={session?.paymentKind || paymentKind}
                  readOnly
                />
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
                    shipping={shipping}
                    billing={
                      same
                        ? {
                            ...shipping,
                            email: shipping.email || billing.email,
                            phone: shipping.phone || billing.phone,
                          }
                        : billing
                    }
                    mockPayment={session.mockPayment}
                    paymentKind={session.paymentKind}
                    redirectUrl={session.redirectUrl}
                    onPaid={(result) => {
                      setCart(emptyStoreCart());
                      toast({
                        title: "Order completed",
                        description:
                          "Kindly check your email for the order details and tracking link.",
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
            )}
          </section>

          <aside className="lg:sticky lg:top-24">
            <CartTotalsSummary cart={cart} />
          </aside>
        </div>
      )}
    </main>
  );
}

function methodNote(kind: CheckoutPaymentKind) {
  if (kind === "paypal") return "Approve the payment in PayPal.";
  if (kind === "afterpay") return "Finish on Afterpay, then return here.";
  return "Card details stay with Stripe.";
}

function PaymentMethodPicker({
  methods,
  value,
  onChange,
  readOnly = false,
}: {
  methods: CheckoutPaymentMethod[];
  value: CheckoutPaymentKind | "" | "mock";
  onChange?: (kind: CheckoutPaymentKind) => void;
  readOnly?: boolean;
}) {
  const { settings } = useStore();
  if (!methods.length) {
    return (
      <p className="rounded-2xl border border-foreground/15 bg-muted px-4 py-4 text-sm font-medium text-foreground">
        No payment methods are turned on for this store.
      </p>
    );
  }
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-foreground">Pay with</legend>
      <div className="grid gap-2">
        {methods.map((method) => {
          const selected = value === method.kind;
          const icons = iconsForCheckoutMethods(
            [method],
            settings.productPage?.stripeCardBrands,
          );
          return (
            <label
              key={method.kind}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3",
                selected
                  ? "border-foreground bg-card ring-2 ring-foreground"
                  : "border-foreground/15 bg-card",
                readOnly ? "" : "cursor-pointer",
              )}
            >
              <input
                type="radio"
                name="payment-method"
                className="sr-only"
                checked={selected}
                disabled={readOnly}
                onChange={() => onChange?.(method.kind)}
              />
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  selected ? "border-foreground" : "border-foreground/35",
                )}
                aria-hidden
              >
                {selected ? (
                  <span className="size-2.5 rounded-full bg-foreground" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {method.title}
                </span>
                <span className="block text-xs text-foreground/70">
                  {methodNote(method.kind)}
                </span>
              </span>
              <span className="flex shrink-0 flex-wrap justify-end gap-1">
                {icons.slice(0, 3).map((icon) => (
                  <PaymentBrandIcon
                    key={icon.slug}
                    slug={icon.slug}
                    label={icon.label}
                  />
                ))}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
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
    <div className={cn("min-w-0 space-y-2", className)}>
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
      <h2 className="font-display text-xl">Order summary</h2>
      <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
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
              {formatPrice(
                item.price * item.quantity,
                settings,
                cart.totals.currency,
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="space-y-1 border-t border-border pt-3 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="tabular-nums">
            {formatPrice(cart.totals.subtotal, settings, cart.totals.currency)}
          </span>
        </div>
        {cart.totals.discount > 0 ? (
          <div className="flex justify-between">
            <span>Discount</span>
            <span className="tabular-nums">
              -
              {formatPrice(
                cart.totals.discount,
                settings,
                cart.totals.currency,
              )}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="tabular-nums">
            {formatPrice(cart.totals.shipping, settings, cart.totals.currency)}
          </span>
        </div>
        {cart.totals.tax > 0 ? (
          <div className="flex justify-between">
            <span>Tax</span>
            <span className="tabular-nums">
              {formatPrice(cart.totals.tax, settings, cart.totals.currency)}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between pt-1 font-medium">
          <span>Total</span>
          <span className="tabular-nums">
            {formatPrice(cart.totals.total, settings, cart.totals.currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
