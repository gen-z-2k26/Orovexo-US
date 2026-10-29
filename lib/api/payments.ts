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

function kindForGateway(id: string): CheckoutPaymentKind | null {
  const key = id.toLowerCase();
  if (key === "ppcp-gateway" || key === "paypal" || key === "ppec_paypal") {
    return "paypal";
  }
  if (key === "afterpay" || key === "afterpay-clearpay") {
    return "afterpay";
  }
  if (key === "stripe" || key === "woocommerce_payments") {
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
      const kind = kindForGateway(gateway.id);
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

export function wooPayUrl(orderId: string, orderKey: string) {
  const origin = process.env.WC_URL?.trim().replace(/\/$/, "");
  if (!origin || !orderId || !orderKey) return "";
  return `${origin}/checkout/order-pay/${orderId}/?pay_for_order=true&key=${encodeURIComponent(orderKey)}`;
}
