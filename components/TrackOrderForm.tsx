"use client";

import { useState } from "react";
import { lookupGuestOrderAction } from "@/app/actions/orders";
import { useStore } from "@/lib/store-context";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GuestOrder } from "@/lib/types";
import { toast } from "@/lib/toast-store";

export function TrackOrderForm() {
  const { settings } = useStore();
  const [orderId, setOrderId] = useState("");
  const [orderKey, setOrderKey] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<GuestOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const message = err instanceof Error ? err.message : "Order not found.";
      setError(message);
      toast({ title: "Order not found", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-8">
      <form className="space-y-4 text-left" onSubmit={(event) => void onSubmit(event)}>
        <div className="space-y-2">
          <Label htmlFor="track-id">Order number</Label>
          <Input
            id="track-id"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="track-key">Order key</Label>
          <Input
            id="track-key"
            value={orderKey}
            onChange={(event) => setOrderKey(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="track-email">Billing email</Label>
          <Input
            id="track-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Looking up..." : "Track order"}
        </Button>
      </form>

      {order ? (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-left">
          <p className="font-medium">Order {order.orderId}</p>
          <p className="text-sm text-muted-foreground">
            {order.status}
            {order.paid ? " · Paid" : ""}
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
            <span className="tabular-nums">
              {formatPrice(order.totals.total, settings)}
            </span>
          </p>
          {order.shippingAddress.address1 ? (
            <p className="text-sm text-muted-foreground">
              Ships to {order.shippingAddress.address1}, {order.shippingAddress.city}{" "}
              {order.shippingAddress.postcode}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
