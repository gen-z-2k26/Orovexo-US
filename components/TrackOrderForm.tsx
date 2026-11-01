"use client";

import { useEffect, useState } from "react";
import { lookupGuestOrderAction } from "@/app/actions/orders";
import { useStore } from "@/lib/store-context";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StoreImage } from "@/components/StoreImage";
import type { GuestOrder } from "@/lib/types";
import { toast } from "@/lib/toast-store";

function statusLabel(order: GuestOrder) {
  if (order.paid) return "Paid";
  const status = order.status?.replace(/-/g, " ") || "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function TrackOrderForm({
  initialOrderId = "",
  initialOrderKey = "",
  initialEmail = "",
}: {
  initialOrderId?: string;
  initialOrderKey?: string;
  initialEmail?: string;
}) {
  const { settings } = useStore();
  const [orderId, setOrderId] = useState(initialOrderId);
  const [orderKey, setOrderKey] = useState(initialOrderKey);
  const [email, setEmail] = useState(initialEmail);
  const [order, setOrder] = useState<GuestOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialOrderId || !initialOrderKey || !initialEmail) return;
    let cancelled = false;
    setLoading(true);
    lookupGuestOrderAction({
      orderId: initialOrderId,
      orderKey: initialOrderKey,
      email: initialEmail,
    })
      .then((found) => {
        if (cancelled) return;
        setOrder(found);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Order not found.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialOrderId, initialOrderKey, initialEmail]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const found = await lookupGuestOrderAction({
        orderId,
        orderKey,
        email,
      });
      setOrder(found);
      toast({
        title: "Order found",
        description: `Order ${found.orderId} is ${found.status || "on file"}.`,
      });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const message =
        !raw || raw.includes("Minified React error")
          ? "Order not found. Check the order number, order key, and email."
          : raw;
      setError(message);
      toast({ title: "Order not found", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  const currency = order?.totals.currency;
  const ship = order?.shippingAddress;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      <form
        className="space-y-5 rounded-2xl border border-foreground/15 bg-card p-5 text-left sm:p-7"
        onSubmit={(event) => void onSubmit(event)}
      >
        <div>
          <h2 className="font-display text-2xl text-foreground">Look up</h2>
          <p className="mt-2 text-sm text-foreground/75">
            These three fields are in the confirmation email.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="track-id" className="text-foreground">
            Order number
          </Label>
          <Input
            id="track-id"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="888"
            autoComplete="off"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="track-key" className="text-foreground">
            Order key
          </Label>
          <Input
            id="track-key"
            value={orderKey}
            onChange={(event) => setOrderKey(event.target.value)}
            placeholder="wc_order_..."
            autoComplete="off"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="track-email" className="text-foreground">
            Billing email
          </Label>
          <Input
            id="track-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Looking up..." : "Track order"}
        </Button>
      </form>

      {order ? (
        <div className="overflow-hidden rounded-2xl border border-foreground/15 bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-foreground px-5 py-4 text-background sm:px-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-background/70">
                Order
              </p>
              <p className="font-display text-3xl tabular-nums">#{order.orderId}</p>
            </div>
            <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground">
              {statusLabel(order)}
            </span>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <ul className="divide-y divide-foreground/10">
              {order.items.map((item) => (
                <li key={item.key} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-foreground/10 bg-muted">
                    <StoreImage src={item.image} alt="" sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="mt-1 text-sm text-foreground/70">Qty {item.quantity}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {formatPrice(item.price * item.quantity, settings, currency)}
                  </p>
                </li>
              ))}
            </ul>
            {ship?.address1 ? (
              <div className="rounded-xl bg-muted p-4">
                <p className="text-xs font-semibold tracking-wide uppercase text-foreground/60">
                  Ships to
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  {[ship.address1, ship.address2].filter(Boolean).join(", ")}
                  <br />
                  {[ship.city, ship.state, ship.postcode].filter(Boolean).join(", ")}
                  {ship.country ? <><br />{ship.country}</> : null}
                </p>
              </div>
            ) : null}
            <div className="flex items-center justify-between rounded-xl bg-foreground px-4 py-3 text-background">
              <span className="text-sm font-semibold tracking-wide uppercase">Total</span>
              <span className="font-display text-2xl tabular-nums">
                {formatPrice(order.totals.total, settings, currency)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-foreground/20 bg-card p-8 text-center">
          <p className="max-w-xs text-sm font-medium text-foreground/75">
            {loading
              ? "Looking up your order..."
              : "Enter your details. The order, items, and total appear here."}
          </p>
        </div>
      )}
    </div>
  );
}
