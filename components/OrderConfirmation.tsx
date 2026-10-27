"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { completeCheckoutAction } from "@/app/actions/checkout";
import { lookupGuestOrderAction } from "@/app/actions/orders";
import { emptyStoreCart } from "@/lib/api/map-cart";
import { useCartStore } from "@/lib/cart-store";
import { useStore } from "@/lib/store-context";
import { formatPrice } from "@/lib/format";
import { pageContainer } from "@/lib/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GuestOrder } from "@/lib/types";
import { toast } from "@/lib/toast-store";

export function OrderConfirmation({
  orderId,
  orderKey,
  email,
  paymentIntentId,
  redirectStatus,
}: {
  orderId: string;
  orderKey: string;
  email: string;
  paymentIntentId: string;
  redirectStatus: string;
}) {
  const { settings } = useStore();
  const setCart = useCartStore((state) => state.setCart);
  const [order, setOrder] = useState<GuestOrder | null>(null);
  const [lookupEmail, setLookupEmail] = useState(email);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (redirectStatus && redirectStatus !== "succeeded") {
          setError("Payment was not completed. You can retry checkout from your cart.");
          return;
        }
        if (paymentIntentId && (redirectStatus === "succeeded" || !redirectStatus)) {
          const paid = await completeCheckoutAction({
            orderId,
            orderKey,
            paymentIntentId,
          });
          if (cancelled) return;
          setCart(emptyStoreCart());
          setOrder({
            orderId: paid.orderId,
            orderKey: paid.orderKey,
            status: paid.status,
            paid: paid.paid,
            email: paid.email,
            name: paid.name,
            totals: {
              subtotal: paid.total,
              discount: 0,
              shipping: 0,
              tax: 0,
              total: paid.total,
              currency: paid.currency,
              minorUnit: 2,
              totalMinor: String(Math.round(paid.total * 100)),
            },
            items: paid.items.map((item, index) => ({
              key: `${item.productId}-${index}`,
              productId: item.productId,
              slug: item.slug,
              name: item.name,
              price: item.price,
              image: item.image,
              quantity: item.quantity,
              quantityMin: 1,
              quantityMax: item.quantity,
            })),
            shippingAddress: emptyStoreCart().shippingAddress,
            billingAddress: emptyStoreCart().billingAddress,
            coupons: [],
            createdAt: paid.createdAt,
          });
          if (paid.email) {
            const guest = await lookupGuestOrderAction({
              orderId: paid.orderId,
              orderKey: paid.orderKey || orderKey,
              email: paid.email,
            }).catch(() => null);
            if (!cancelled && guest) setOrder(guest);
          }
          return;
        }
        if (orderKey && email) {
          const guest = await lookupGuestOrderAction({
            orderId,
            orderKey,
            email,
          });
          if (!cancelled) setOrder(guest);
          return;
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Order not found.";
          setError(message);
          toast({ title: "Could not load order", description: message, variant: "error" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, orderKey, email, paymentIntentId, redirectStatus, setCart]);

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      setOrder(
        await lookupGuestOrderAction({
          orderId,
          orderKey,
          email: lookupEmail,
        }),
      );
      toast({ title: "Order found", description: `Order ${orderId}` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Order not found.";
      setError(message);
      toast({ title: "Order not found", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={pageContainer("py-16")}>
      <p className="text-sm font-medium text-primary">Order</p>
      <h1 className="mt-3 font-display text-4xl">
        {order?.paid ? "Order confirmed" : "Order status"}
      </h1>
      {loading ? (
        <p className="mt-4 text-muted-foreground">Loading order...</p>
      ) : null}
      {error ? <p className="mt-4 text-destructive">{error}</p> : null}
      {!order && !loading ? (
        <form className="mt-8 max-w-md space-y-4" onSubmit={(event) => void lookup(event)}>
          <p className="text-sm text-muted-foreground">
            Enter the billing email for order {orderId} to view it.
          </p>
          <div className="space-y-2">
            <Label htmlFor="confirm-email">Email</Label>
            <Input
              id="confirm-email"
              type="email"
              value={lookupEmail}
              onChange={(event) => setLookupEmail(event.target.value)}
              required
            />
          </div>
          <Button type="submit">View order</Button>
        </form>
      ) : null}
      {order ? (
        <div className="mt-8 max-w-xl space-y-4 rounded-2xl border border-border bg-card p-6">
          <p>
            Order <span className="tabular-nums font-medium">{order.orderId}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Status: {order.status}
            {order.paid ? " · Paid" : " · Payment pending"}
          </p>
          <p className="text-sm">
            Keep this order key for tracking:{" "}
            <span className="font-medium">{order.orderKey}</span>
          </p>
          <ul className="space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={item.key} className="flex justify-between gap-3">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span className="tabular-nums">
                  {formatPrice(item.price * item.quantity, settings)}
                </span>
              </li>
            ))}
          </ul>
          <p className="flex justify-between border-t border-border pt-3">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(order.totals.total, settings)}</span>
          </p>
          <Link
            href="/track-order"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-4 text-sm text-background"
          >
            Track this order
          </Link>
        </div>
      ) : null}
    </div>
  );
}
