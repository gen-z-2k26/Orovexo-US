import { isWooConfigured, isWooUnreachable, wooGet } from "@/lib/api/client";
import type { CheckoutPaymentKind, CheckoutPaymentMethod } from "@/lib/types";

type WooGateway = {
  id?: string;
  enabled?: boolean | string;
  title?: string;
  method_title?: string;
};

export function isWooGatewayEnabled(value: unknown) {
  return value === true || value === "yes" || value === "true";
}

export function checkoutKindForGateway(id: string): CheckoutPaymentKind | null {
  const key = id.toLowerCase();
  if (key.includes("klarna") || key.includes("affirm") || key.includes("link")) {
    return null;
  }
  if (key.includes("paypal") || key.includes("ppcp") || key === "ppec_paypal") {
    return "paypal";
  }
  if (key.includes("afterpay") || key.includes("clearpay")) {
    return "afterpay";
  }
  if (
    key === "stripe" ||
    key === "woocommerce_payments" ||
    key.startsWith("stripe")
  ) {
    return "stripe";
  }
  return null;
}

const KIND_ORDER: CheckoutPaymentKind[] = ["paypal", "stripe", "afterpay"];

export async function getEnabledCheckoutMethods(): Promise<
  CheckoutPaymentMethod[]
> {
  if (!isWooConfigured() || isWooUnreachable()) return [];

  try {
    const gateways = await wooGet<WooGateway[]>("payment_gateways");
    const found = new Map<CheckoutPaymentKind, CheckoutPaymentMethod>();
    for (const gateway of gateways) {
      if (!gateway.id || !isWooGatewayEnabled(gateway.enabled)) continue;
      const kind = checkoutKindForGateway(gateway.id);
      if (!kind || found.has(kind)) continue;
      found.set(kind, {
        kind,
        wooId: gateway.id,
        title:
          gateway.title ||
          gateway.method_title ||
          (kind === "paypal"
            ? "PayPal"
            : kind === "afterpay"
              ? "Afterpay"
              : "Card"),
      });
    }
    return KIND_ORDER.map((kind) => found.get(kind)).filter(
      (method): method is CheckoutPaymentMethod => Boolean(method),
    );
  } catch {
    return [];
  }
}

