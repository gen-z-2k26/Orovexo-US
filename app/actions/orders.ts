"use server";

import { headers } from "next/headers";
import { getOrder, mapWooOrder } from "@/lib/api/orders";
import { emptyAddress } from "@/lib/api/map-cart";
import { getGuestStoreOrder } from "@/lib/api/store-api";
import type { GuestOrder } from "@/lib/types";

const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_HITS = 8;

function clientKey(headerList: Headers) {
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "local"
  );
}

function rateLimited(key: string) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_HITS;
}

export async function lookupGuestOrderAction(input: {
  orderId: string;
  orderKey: string;
  email: string;
}): Promise<GuestOrder> {
  const headerList = await headers();
  if (rateLimited(clientKey(headerList))) {
    throw new Error("Too many attempts. Please wait a minute and try again.");
  }

  const orderId = input.orderId.trim();
  const orderKey = input.orderKey.trim();
  const email = input.email.trim();
  if (!orderId || !orderKey || !email) {
    throw new Error("Order not found.");
  }

  try {
    return await getGuestStoreOrder({ orderId, orderKey, email });
  } catch {
    try {
      const order = await getOrder(orderId);
      const billed = order.billing?.email?.trim().toLowerCase() || "";
      if (
        (order.order_key || "") !== orderKey ||
        billed !== email.toLowerCase()
      ) {
        throw new Error("Order not found.");
      }
      const mapped = mapWooOrder(order);
      return {
        orderId: mapped.orderId,
        orderKey: mapped.orderKey || orderKey,
        status: mapped.status,
        paid: mapped.paid,
        email: mapped.email,
        name: mapped.name,
        totals: {
          subtotal: mapped.total,
          discount: 0,
          shipping: 0,
          tax: 0,
          total: mapped.total,
          currency: mapped.currency,
          minorUnit: 2,
          totalMinor: String(Math.round(mapped.total * 100)),
        },
        items: mapped.items.map((item, index) => ({
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
        shippingAddress: emptyAddress(),
        billingAddress: {
          ...emptyAddress(),
          email: mapped.email,
          firstName: mapped.name.split(" ")[0] || "",
          lastName: mapped.name.split(" ").slice(1).join(" "),
          address1: mapped.address,
        },
        coupons: [],
        createdAt: mapped.createdAt,
      } satisfies GuestOrder;
    } catch {
      throw new Error("Order not found.");
    }
  }
}
