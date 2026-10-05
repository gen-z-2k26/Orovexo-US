"use client";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

export type PaymentStepProps = {
  storeId: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
};

/**
 * Placeholder for a future per-store payment gateway.
 * Each store will eventually connect its own merchant account here.
 */
export function PaymentStep({
  storeId,
  amount,
  currency,
  onSuccess,
}: PaymentStepProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-dashed border-border bg-muted/40 p-5">
      <div className="space-y-1.5">
        <p className="font-medium">Payment integration coming soon</p>
        <p className="text-pretty text-sm text-muted-foreground">
          Store <span className="font-medium text-foreground">{storeId}</span>{" "}
          will use its own gateway account. For this demo, confirm the mock
          payment of{" "}
          <span className="tabular-nums">
            {formatPrice(amount, currency, "en-US")}
          </span>
          .
        </p>
      </div>
      <Button
        type="button"
        size="lg"
        className="h-12 w-full rounded-2xl"
        onClick={onSuccess}
      >
        Confirm mock payment
      </Button>
    </div>
  );
}
