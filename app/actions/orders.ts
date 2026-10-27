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

function isOrderKey(value: string) {
  return /^wc_order_/i.test(value);
}

function isOrderNumber(value: string) {
  return /^\d+$/.test(value);
}

/** Accepts swapped number/key fields from the track-order form. */
function normalizeLookup(orderId: string, orderKey: string) {
  const id = orderId.trim();
  const key = orderKey.trim();
  if (isOrderKey(id) && isOrderNumber(key)) {
    return { orderId: key, orderKey: id };
  }
  return { orderId: id, orderKey: key };
}

function toPlainOrder(order: GuestOrder): GuestOrder {
  return JSON.parse(JSON.stringify(order)) as GuestOrder;
}

function statusText(value: unknown) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  if ("status" in value && typeof (value as { status?: unknown }).status === "string") {
    return (value as { status: string }).status;
  }
  return "";
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

  const { orderId, orderKey } = normalizeLookup(input.orderId, input.orderKey);
  const email = input.email.trim();
  if (!orderId || !orderKey || !email) {
    throw new Error("Order not found.");
  }

  try {
    const guest = await getGuestStoreOrder({ orderId, orderKey, email });
    return toPlainOrder({
      ...guest,
      orderId: String(guest.orderId),
      orderKey: String(guest.orderKey || orderKey),
      status: statusText(guest.status),
    });
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
      const mappedGuest = {
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
      return toPlainOrder({
        ...mappedGuest,
        status: statusText(mappedGuest.status),
      });
    } catch {
      throw new Error("Order not found.");
    }
  }
}
