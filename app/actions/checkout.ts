"use server";

import { createOrder } from "@/lib/api";
import type { CheckoutPayload, CreateOrderResult } from "@/lib/types";

export async function placeOrderAction(
  payload: CheckoutPayload,
): Promise<CreateOrderResult> {
  return createOrder(payload);
}
