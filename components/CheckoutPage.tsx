"use client";

import { useEffect, useRef, useState } from "react";
import { IntentLink as Link } from "@/components/IntentLink";
import { useRouter } from "next/navigation";
import {
  Award,
  ChevronDown,
  ChevronLeft,
  Gift,
  Loader2,
  Lock,
  Minus,
  Package,
  ShoppingBag,
  Plus,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { StoreImage } from "@/components/StoreImage";
import { BrandLogo } from "@/components/BrandLogo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentBrandIcon } from "@/components/PaymentBrandIcon";
import {
  AfterpayPayment,
  PaymentFormSkeleton,
  PaymentStep,
} from "@/components/PaymentStep";
import { iconsForCheckoutMethods } from "@/lib/checkout-icons";
import { useCartStore } from "@/lib/cart-store";
import { useStore } from "@/lib/store-context";
import { formatPrice } from "@/lib/format";
import { emptyAddress, emptyStoreCart } from "@/lib/api/map-cart";
import {
  createCheckoutSessionAction,
  getCheckoutOptionsAction,
} from "@/app/actions/checkout";
import {
  applyCouponAction,
  removeCouponAction,
  removeCartItemAction,
  selectShippingRateAction,
  updateCartItemAction,
  updateCustomerAction,
} from "@/app/actions/cart";
import { unwrapCart, unwrapResult } from "@/lib/cart-result";
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
import { userErrorMessage } from "@/lib/user-error";

function addressFromCart(source: Address, fallbackCountry: string): Address {
  return {
    ...emptyAddress(),
    ...source,
    country: source.country || fallbackCountry,
  };
}

function buildCustomerNote(isGift: boolean, note: string) {
  const parts: string[] = [];
  if (isGift) parts.push("Gift order: skip prices on the packing slip.");
  if (note.trim()) parts.push(note.trim());
  return parts.join("\n");
}

function addressReady(address: Address) {
  return Boolean(
    address.address1.trim() &&
      address.city.trim() &&
      address.postcode.trim() &&
      address.country.trim(),
  );
}

export function CheckoutPage() {
  const router = useRouter();
  const { settings } = useStore();
  const cart = useCartStore((state) => state.cart);
  const setCart = useCartStore((state) => state.setCart);
  const setOpen = useCartStore((state) => state.setOpen);
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
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [affirmPublicKey, setAffirmPublicKey] = useState("");
  const [affirmEnv, setAffirmEnv] = useState<"sandbox" | "live">("sandbox");
  const [isGift, setIsGift] = useState(false);
  const [sellerNote, setSellerNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const syncKey = useRef("");
  const shippingRef = useRef(shipping);
  const billingRef = useRef(billing);
  const sameRef = useRef(same);
  shippingRef.current = shipping;
  billingRef.current = billing;
  sameRef.current = same;

  useEffect(() => {
    let cancelled = false;
    getCheckoutOptionsAction()
      .then(unwrapResult)
      .then((options) => {
        if (cancelled) return;
        setCart(options.cart);
        setCountries(options.countries);
        setMockPayment(options.mockPayment);
        setPaymentMethods(options.paymentMethods);
        setStripePublishableKey(options.stripePublishableKey);
        setPaypalClientId(options.paypalClientId);
        setAffirmPublicKey(options.affirmPublicKey);
        setAffirmEnv(options.affirmEnv);
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
            form: userErrorMessage(error, "Could not load checkout."),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [setCart]);

  useEffect(() => {
    if (session && session.cart.cartHash !== cart.cartHash) {
      setSession(null);
      setSessionError("");
    }
  }, [cart.cartHash, session]);

  async function refreshRates(nextShipping = shippingRef.current) {
    if (!addressReady(nextShipping)) return;
    const currentBilling = billingRef.current;
    const billingSame = sameRef.current;
    const key = [
      nextShipping.address1,
      nextShipping.address2,
      nextShipping.city,
      nextShipping.state,
      nextShipping.postcode,
      nextShipping.country,
    ].join("|");
    if (key === syncKey.current) return;
    syncKey.current = key;
    const nextBilling = billingSame
      ? {
          ...nextShipping,
          email: nextShipping.email || currentBilling.email,
          phone: nextShipping.phone || currentBilling.phone,
        }
      : currentBilling;
    try {
      setCart(
        unwrapCart(
          await updateCustomerAction({
            shipping: nextShipping,
            billing: nextBilling,
          }),
        ),
      );
    } catch {
      syncKey.current = "";
    }
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!shipping.firstName.trim()) next.firstName = "First name is required.";
    if (!shipping.lastName.trim()) next.lastName = "Last name is required.";
    if (!shipping.address1.trim()) next.address1 = "Street address is required.";
    if (!shipping.city.trim()) next.city = "City is required.";
    if (!shipping.postcode.trim()) next.postcode = "ZIP code is required.";
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
    const next = unwrapCart(
      await updateCustomerAction({
        shipping,
        billing: nextBilling,
      }),
    );
    setCart(next);
    return next;
  }

  async function proceedToPayment() {
    if (!cart.items.length || !validate()) return;
    setSubmitting(true);
    setSessionError("");
    setSession(null);
    try {
      const nextCart = await syncAddress();
      if (
        nextCart.needsShipping &&
        !nextCart.shippingRates.some((rate) => rate.selected)
      ) {
        setErrors({ form: "Select a shipping method." });
        setSubmitting(false);
        return;
      }
      const nextSession = unwrapResult(
        await createCheckoutSessionAction({
          shipping,
          billing: same ? { ...shipping, email: shipping.email } : billing,
          billingSameAsShipping: same,
          paymentKind: paymentKind || undefined,
          customerNote: buildCustomerNote(isGift, sellerNote),
        }),
      );
      setCart(nextSession.cart);
      setSession(nextSession);
    } catch (error) {
      const message = userErrorMessage(
        error,
        "Could not start checkout. Check your details and try again.",
      );
      setSessionError(message);
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  }

  async function chooseRate(packageId: number, rateId: string) {
    try {
      setCart(unwrapCart(await selectShippingRateAction({ packageId, rateId })));
      setSession(null);
    } catch (error) {
      setErrors({
        form: userErrorMessage(error, "Could not select shipping."),
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
  const shippingReady = addressReady(shipping);
  const showRates = cart.needsShipping && cart.shippingRates.length > 0;

  return (
    <div className="min-h-full bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto grid h-14 w-full max-w-[1240px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 sm:h-16 sm:px-6 lg:px-10">
          {cart.items.length ? (
            <button
              type="button"
              className="inline-flex min-w-0 items-center gap-1 justify-self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setOpen(true)}
            >
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              <span className="truncate sm:hidden">Cart</span>
              <span className="hidden truncate sm:inline">Back to cart</span>
            </button>
          ) : (
            <Link
              href="/products"
              className="inline-flex min-w-0 items-center gap-1 justify-self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              <span className="truncate sm:hidden">Shop</span>
              <span className="hidden truncate sm:inline">Back to products</span>
            </Link>
          )}
          <Link href="/" aria-label={settings.name} className="justify-self-center">
            <BrandLogo heightClass="h-6 max-w-[9.5rem] sm:h-8 sm:max-w-none" />
          </Link>
          <span aria-hidden />
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[1240px] items-start gap-x-10 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-10 lg:py-10">
      <div className={cn("min-w-0", !cart.items.length && "lg:col-span-2")}>

      {!cart.items.length ? (
        <div className="flex min-h-[62vh] items-center justify-center">
          <div className="w-full max-w-[440px] rounded-[8px] border border-border bg-card px-8 py-12 text-center shadow-sm">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted text-foreground">
              <ShoppingBag className="size-6" aria-hidden />
            </span>
            <h1 className="font-display mt-6 text-[28px] leading-tight tracking-tight">
              Your cart is empty
            </h1>
            <p className="mx-auto mt-3 max-w-[32ch] text-sm leading-relaxed text-muted-foreground">
              Add something you like, then come back here to check out.
            </p>
            <Link
              href="/products"
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-8 h-[52px] w-full rounded-[8px] text-sm font-medium tracking-[0.08em] uppercase",
              )}
            >
              Browse products
            </Link>
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-[8px] border border-border bg-card px-3.5 py-3 text-sm lg:hidden"
            onClick={() => setShowSummary((open) => !open)}
          >
            <span className="flex items-center gap-2 font-medium">
              {showSummary ? "Hide" : "Show"} order summary
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  showSummary && "rotate-180",
                )}
              />
            </span>
            <span className="tabular-nums font-medium">
              {formatPrice(cart.totals.total, settings, cart.totals.currency)}
            </span>
          </button>
          <div className={cn("mt-4 w-full lg:hidden", showSummary ? "block" : "hidden")}>
            <div className="rounded-[8px] border border-border bg-card p-4 sm:p-5">
              <OrderSummary cart={cart} />
              <PromiseCard />
            </div>
          </div>

          <section className="min-w-0 pb-8 pt-6 sm:pb-16 sm:pt-8">
            <form
              className="mx-auto w-full max-w-[560px] space-y-7 sm:space-y-9 lg:mx-0"
              onSubmit={(event) => {
                event.preventDefault();
                void proceedToPayment();
              }}
            >
              <section className="space-y-3">
                <h2 className="text-base font-semibold">Contact</h2>
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
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold">Shipping address</h2>
                <div className="grid min-w-0 grid-cols-2 gap-3">
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
                    className="col-span-2"
                    id="address1"
                    label="Street address"
                    value={shipping.address1}
                    error={errors.address1}
                    onChange={(value) =>
                      setShipping({ ...shipping, address1: value })
                    }
                    onBlur={() => void refreshRates()}
                  />
                  <Field
                    className="col-span-2"
                    id="address2"
                    label="Apartment, suite, etc. (optional)"
                    value={shipping.address2}
                    onChange={(value) =>
                      setShipping({ ...shipping, address2: value })
                    }
                    onBlur={() => void refreshRates()}
                  />
                  <div className="col-span-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field
                      className="sm:col-span-2 lg:col-span-1"
                      id="city"
                      label="City"
                      value={shipping.city}
                      error={errors.city}
                      onChange={(value) =>
                        setShipping({ ...shipping, city: value })
                      }
                      onBlur={() => void refreshRates()}
                    />
                    {stateOptions.length ? (
                      <CheckoutSelect
                        id="state"
                        label="State / Province"
                        value={shipping.state}
                        options={stateOptions}
                        onChange={(value) => {
                          const next = { ...shipping, state: value };
                          setShipping(next);
                          void refreshRates(next);
                        }}
                      />
                    ) : (
                      <Field
                        id="state"
                        label="State / Province"
                        value={shipping.state}
                        onChange={(value) =>
                          setShipping({ ...shipping, state: value })
                        }
                        onBlur={() => void refreshRates()}
                      />
                    )}
                    <Field
                      id="postcode"
                      label="ZIP code"
                      value={shipping.postcode}
                      error={errors.postcode}
                      onChange={(value) =>
                        setShipping({ ...shipping, postcode: value })
                      }
                      onBlur={() => void refreshRates()}
                    />
                  </div>
                  {countryOptions.length ? (
                    <CheckoutSelect
                      className="col-span-2"
                      id="country"
                      label="Select country / region"
                      value={shipping.country}
                      options={countryOptions}
                      onChange={(value) => {
                        const next = {
                          ...shipping,
                          country: value,
                          state: "",
                        };
                        setShipping(next);
                        void refreshRates(next);
                      }}
                    />
                  ) : (
                    <Field
                      className="col-span-2"
                      id="country"
                      label="Select country / region"
                      value={shipping.country}
                      error={errors.country}
                      onChange={(value) =>
                        setShipping({ ...shipping, country: value })
                      }
                      onBlur={() => void refreshRates()}
                    />
                  )}
                  <Field
                    className="col-span-2"
                    id="phone"
                    label="Phone"
                    value={shipping.phone}
                    onChange={(value) =>
                      setShipping({ ...shipping, phone: value })
                    }
                  />
                </div>
                <label className="flex items-start gap-2.5 pt-1 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
                    checked={isGift}
                    onChange={(event) => setIsGift(event.target.checked)}
                  />
                  <span className="flex items-start gap-1.5 leading-snug text-muted-foreground">
                    <Gift className="size-3.5 text-primary" aria-hidden />
                    This is a gift - we will skip prices on the packing slip
                  </span>
                </label>
                {showNote ? (
                  <Field
                    id="seller-note"
                    label="Note for the seller"
                    value={sellerNote}
                    onChange={setSellerNote}
                  />
                ) : (
                  <button
                    type="button"
                    className="text-sm text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
                    onClick={() => setShowNote(true)}
                  >
                    + Add a note for the seller
                  </button>
                )}
                <label className="flex items-start gap-2.5 text-sm leading-snug text-muted-foreground">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
                    checked={same}
                    onChange={(event) => setSame(event.target.checked)}
                  />
                  Billing address is the same as shipping
                </label>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold">Shipping method</h2>
                {!shippingReady ? (
                  <p className="rounded-[8px] bg-muted px-4 py-5 text-center text-sm text-muted-foreground">
                    Enter your address to see shipping options.
                  </p>
                ) : showRates ? (
                  <div className="overflow-hidden rounded-[8px] border border-border bg-card">
                    {cart.shippingRates.map((rate, index) => (
                      <label
                        key={`${rate.packageId}-${rate.rateId}`}
                        className={cn(
                          "flex items-center justify-between gap-3 px-4 py-3.5 text-sm",
                          index > 0 && "border-t border-border/70",
                          rate.selected && "bg-primary/10",
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex size-4 items-center justify-center rounded-full border-2",
                              rate.selected
                                ? "border-primary"
                                : "border-foreground/25",
                            )}
                          >
                            {rate.selected ? (
                              <span className="size-2 rounded-full bg-primary" />
                            ) : null}
                          </span>
                          <input
                            type="radio"
                            name="shipping-rate"
                            className="sr-only"
                            checked={rate.selected}
                            onChange={() =>
                              void chooseRate(rate.packageId, rate.rateId)
                            }
                          />
                          {rate.name}
                        </span>
                        <span
                          className={cn(
                            "tabular-nums",
                            rate.price <= 0 && "font-medium text-primary",
                          )}
                        >
                          {rate.price <= 0
                            ? "FREE"
                            : formatPrice(
                                rate.price,
                                settings,
                                cart.totals.currency,
                              )}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No shipping methods are available for this address yet.
                  </p>
                )}
              </section>

              <section className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold">Payment</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    All transactions are secure and encrypted.
                  </p>
                </div>
                <PaymentMethodPicker
                  methods={paymentMethods}
                  value={paymentKind}
                  onChange={(kind) => {
                    setPaymentKind(kind);
                    setSession(null);
                  }}
                />
                {sessionError && !session ? (
                  <p className="text-sm text-destructive">{sessionError}</p>
                ) : null}
                {session && paymentKind !== "afterpay" ? (
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
                    stripePublishableKey={stripePublishableKey}
                    paypalClientId={paypalClientId}
                    affirmPublicKey={affirmPublicKey}
                    affirmEnv={affirmEnv}
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
                      setErrors({
                        form: userErrorMessage(
                          new Error(message),
                          "Payment could not be completed. Try again.",
                        ),
                      });
                    }}
                  />
                ) : submitting && paymentKind !== "afterpay" ? (
                  <PaymentFormSkeleton />
                ) : null}
              </section>

              {errors.form ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.form}
                </p>
              ) : null}

              {paymentKind === "afterpay" ? (
                <>
                  <Button
                    type={session?.redirectUrl ? "button" : "submit"}
                    size="lg"
                    className="h-[52px] w-full rounded-[8px] text-sm font-medium tracking-[0.08em] uppercase"
                    disabled={submitting || !cart.items.length}
                    onClick={
                      session?.redirectUrl
                        ? () => {
                            window.location.assign(session.redirectUrl!);
                          }
                        : undefined
                    }
                  >
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Lock className="size-4" aria-hidden />
                    )}
                    {session?.redirectUrl
                      ? "Continue to Afterpay"
                      : "Proceed to payment"}
                  </Button>
                  {submitting ? <PaymentFormSkeleton /> : null}
                  {session ? (
                    <AfterpayPayment
                      amount={session.amount}
                      currency={session.currency}
                      redirectUrl={session.redirectUrl}
                      showAction={false}
                    />
                  ) : null}
                </>
              ) : !session ? (
                <Button
                  type="submit"
                  size="lg"
                  className="h-[52px] w-full rounded-[8px] text-sm font-medium tracking-[0.08em] uppercase"
                  disabled={
                    !cart.items.length ||
                    submitting ||
                    (!mockPayment && !paymentKind)
                  }
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Lock className="size-4" aria-hidden />
                  )}
                  {submitting ? "Preparing payment..." : "Proceed to payment"}
                </Button>
              ) : null}
            </form>
          </section>
        </>
      )}
      </div>

      {cart.items.length ? (
        <aside className="hidden self-start lg:block">
          <div className="rounded-[8px] border border-border bg-card p-6 shadow-sm">
            <OrderSummary cart={cart} />
            <PromiseCard />
          </div>
        </aside>
      ) : null}
      </div>
    </div>
  );
}

function methodNote(kind: CheckoutPaymentKind) {
  if (kind === "paypal") return "Approve the payment in PayPal.";
  if (kind === "affirm") {
    return "You will confirm an installment plan with Affirm, then return here to finish the order.";
  }
  if (kind === "afterpay") {
    return "You will be redirected to Afterpay to set up your interest-free installments, then brought back to confirm your order.";
  }
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
      <p className="rounded-[8px] border border-foreground/15 bg-muted px-4 py-4 text-sm font-medium text-foreground">
        No payment methods are turned on for this store.
      </p>
    );
  }
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">Pay with</legend>
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
                "flex items-start gap-3 rounded-[8px] border bg-card px-3.5 py-3 sm:items-center sm:px-4 sm:py-3.5",
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border",
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
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 sm:mt-0",
                  selected ? "border-primary" : "border-foreground/35",
                )}
                aria-hidden
              >
                {selected ? (
                  <span className="size-2 rounded-full bg-primary" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {method.title}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {methodNote(method.kind)}
                </span>
              </span>
              <span className="flex max-w-[42%] shrink-0 flex-wrap justify-end gap-1">
                {icons.slice(0, 4).map((icon) => (
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

const fieldShell =
  "h-12 w-full rounded-[8px] border border-border bg-card px-3.5 text-base text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 sm:h-[52px] sm:px-4 sm:text-sm";

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  className,
  onBlur,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  className?: string;
  onBlur?: () => void;
}) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={label}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        className={fieldShell}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function CheckoutSelect({
  id,
  label,
  value,
  onChange,
  options,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldShell, "appearance-none pr-10 outline-none")}
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

function OrderSummary({ cart }: { cart: StoreCart }) {
  const { settings } = useStore();
  const setCart = useCartStore((state) => state.setCart);
  const [coupon, setCoupon] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [qtyBusy, setQtyBusy] = useState("");
  const shippingFree = cart.hasCalculatedShipping && cart.totals.shipping <= 0;
  const taxReady = cart.hasCalculatedShipping;

  async function applyCoupon() {
    if (!coupon.trim()) return;
    setCouponBusy(true);
    try {
      const next = unwrapCart(await applyCouponAction(coupon));
      setCart(next);
      toast({ title: "Coupon applied", description: coupon.trim() });
      setCoupon("");
    } catch (error) {
      toast({
        title: "Coupon could not be applied",
        description: userErrorMessage(error, "Coupon could not be applied."),
        variant: "error",
      });
    } finally {
      setCouponBusy(false);
    }
  }

  async function removeCoupon(code: string) {
    setCouponBusy(true);
    try {
      setCart(unwrapCart(await removeCouponAction(code)));
      toast({ title: "Coupon removed", description: code });
    } catch (error) {
      toast({
        title: "Coupon could not be removed",
        description: userErrorMessage(error, "Coupon could not be removed."),
        variant: "error",
      });
    } finally {
      setCouponBusy(false);
    }
  }

  async function changeQty(key: string, quantity: number) {
    setQtyBusy(key);
    try {
      setCart(unwrapCart(await updateCartItemAction({ key, quantity })));
    } catch (error) {
      toast({
        title: "Could not update quantity",
        description: userErrorMessage(error, "Could not update quantity."),
        variant: "error",
      });
    } finally {
      setQtyBusy("");
    }
  }

  async function removeItem(key: string, name: string) {
    setQtyBusy(key);
    try {
      setCart(unwrapCart(await removeCartItemAction(key)));
      toast({ title: "Removed from cart", description: name });
    } catch (error) {
      toast({
        title: "Could not remove item",
        description: userErrorMessage(error, "Could not remove item."),
        variant: "error",
      });
    } finally {
      setQtyBusy("");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Order summary</h2>
        <span className="text-sm text-muted-foreground">
          {cart.itemsCount} {cart.itemsCount === 1 ? "item" : "items"}
        </span>
      </div>
      {shippingFree ? (
        <p className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-foreground">
          Free shipping
        </p>
      ) : null}
      <ul className="mt-5 space-y-4">
        {cart.items.map((item) => (
          <li key={item.key} className="flex items-start gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-[6px] bg-muted">
              <StoreImage src={item.image} alt="" sizes="56px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug break-words">{item.name}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  className="px-0.5 disabled:opacity-40"
                  disabled={qtyBusy === item.key || item.quantity <= item.quantityMin}
                  onClick={() => void changeQty(item.key, item.quantity - 1)}
                  aria-label={`Decrease quantity for ${item.name}`}
                >
                  <Minus className="size-3" />
                </button>
                <span className="min-w-4 text-center tabular-nums text-foreground">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  className="px-0.5 disabled:opacity-40"
                  disabled={qtyBusy === item.key || item.quantity >= item.quantityMax}
                  onClick={() => void changeQty(item.key, item.quantity + 1)}
                  aria-label={`Increase quantity for ${item.name}`}
                >
                  <Plus className="size-3" />
                </button>
                <button
                  type="button"
                  className="ml-1 hover:text-foreground hover:underline"
                  disabled={qtyBusy === item.key}
                  onClick={() => void removeItem(item.key, item.name)}
                >
                  Remove
                </button>
              </div>
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
      <div className="mt-5 space-y-2">
        {showCoupon || cart.coupons.length ? (
          <div className="flex gap-2">
            <Input
              value={coupon}
              onChange={(event) => setCoupon(event.target.value)}
              placeholder="Discount code"
              aria-label="Discount code"
              className={cn(fieldShell, "h-10")}
            />
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-[8px]"
              disabled={couponBusy || !coupon.trim()}
              onClick={() => void applyCoupon()}
            >
              Apply
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="text-sm font-medium text-foreground/80 hover:underline"
            onClick={() => setShowCoupon(true)}
          >
            Have a discount code?
          </button>
        )}
        {cart.coupons.map((entry) => (
          <div
            key={entry.code}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{entry.code}</span>
            <button
              type="button"
              className="text-xs underline"
              onClick={() => void removeCoupon(entry.code)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">
            {formatPrice(cart.totals.subtotal, settings, cart.totals.currency)}
          </span>
        </div>
        {cart.totals.discount > 0 ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Item savings</span>
            <span className="tabular-nums font-medium text-primary">
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
          <span className="text-muted-foreground">Shipping</span>
          <span
            className={cn(
              "tabular-nums",
              shippingFree && "font-semibold text-primary",
            )}
          >
            {!cart.hasCalculatedShipping
              ? "Enter address"
              : shippingFree
                ? "FREE"
                : formatPrice(
                    cart.totals.shipping,
                    settings,
                    cart.totals.currency,
                  )}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax</span>
          <span className="tabular-nums text-muted-foreground">
            {taxReady && cart.totals.tax > 0
              ? formatPrice(cart.totals.tax, settings, cart.totals.currency)
              : "Calculated at next step"}
          </span>
        </div>
        <div className="flex justify-between pt-1 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">
            {formatPrice(cart.totals.total, settings, cart.totals.currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

function PromiseCard() {
  const items = [
    {
      icon: ShieldCheck,
      title: "Satisfaction guarantee",
      body: "Returns are reviewed within the published return window.",
    },
    {
      icon: Truck,
      title: "Free shipping",
      body: "Free standard shipping on eligible U.S. orders, with no minimum.",
    },
    {
      icon: Award,
      title: "Warranty and support",
      body: "Tested products, with support if something is not right.",
    },
    {
      icon: Package,
      title: "Secure checkout",
      body: "Payments are encrypted. Card details stay with the processor.",
    },
  ];
  return (
    <div className="mt-6 border-t border-border pt-5">
      <h3 className="text-base font-semibold">The Orvexo promise</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Every order, every time.
      </p>
      <ul className="mt-4 space-y-3.5">
        {items.map((item) => (
          <li key={item.title} className="flex gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <item.icon className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-medium">{item.title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                {item.body}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
