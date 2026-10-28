import { Lock } from "lucide-react";
import { PaymentBrandIcon } from "@/components/PaymentBrandIcon";
import type { PaymentMethodIcon } from "@/lib/types";

export function SecurePaymentsBlock({ icons }: { icons: PaymentMethodIcon[] }) {
  return (
    <div className="ppx-secure-block space-y-3 pt-1 text-center">
      <p className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3.5" aria-hidden />
        Encrypted and Secure payments
      </p>
      {icons.length ? (
        <div
          className="flex flex-wrap justify-center gap-2"
          aria-label="Accepted payment methods"
        >
          {icons.map((icon) => (
            <PaymentBrandIcon
              key={icon.slug}
              slug={icon.slug}
              label={icon.label}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
