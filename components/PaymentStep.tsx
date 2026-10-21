"use client";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store-context";

export type PaymentStepProps = {
  amount: number;
  currency: string;
  onSuccess: () => void;
};

export function PaymentStep({ amount, currency, onSuccess }: PaymentStepProps) {
  const { settings } = useStore();

  return (
    <div className="space-y-4 rounded-3xl border border-dashed border-border bg-muted/40 p-5">
      <div className="space-y-1.5">
        <p className="font-medium">Payment coming soon</p>
        <p className="text-pretty text-sm text-muted-foreground">
          For {settings.name}, confirm a mock payment of{" "}
          <span className="tabular-nums">
            {formatPrice(amount, currency, settings.locale)}
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
