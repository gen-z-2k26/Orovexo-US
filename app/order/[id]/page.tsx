import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/OrderConfirmation";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const value = (key: string) => {
    const raw = query[key];
    return Array.isArray(raw) ? raw[0] || "" : raw || "";
  };

  return (
    <OrderConfirmation
      orderId={id}
      orderKey={value("key")}
      email={value("email")}
      paymentIntentId={value("payment_intent") || value("orderToken")}
      redirectStatus={value("redirect_status") || value("status")}
      provider={value("orderToken") ? "afterpay" : "stripe"}
    />
  );
}
