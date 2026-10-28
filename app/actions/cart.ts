"use server";

import { isWooConfigured } from "@/lib/api/client";
import { emptyStoreCart } from "@/lib/api/map-cart";
import {
  addStoreCartItem,
  applyStoreCoupon,
  clearStoreCart,
  getStoreCart,
  removeStoreCartItem,
  removeStoreCoupon,
  selectStoreShippingRate,
  updateStoreCartItem,
  updateStoreCustomer,
} from "@/lib/api/store-api";
import type { Address, StoreCart } from "@/lib/types";

function actionError(error: unknown) {
  return error instanceof Error ? error.message : "The cart could not be updated.";
}

export async function getCartAction(): Promise<StoreCart> {
  if (!isWooConfigured()) return emptyStoreCart();
  try {
    return await getStoreCart();
  } catch {
    return emptyStoreCart();
  }
}

export async function addItemToCartAction(input: {
  id: number;
  quantity?: number;
}): Promise<StoreCart> {
  const quantity = Math.max(1, Number(input.quantity) || 1);
  try {
    return await addStoreCartItem({ id: input.id, quantity });
  } catch (error) {
    throw new Error(actionError(error));
  }
}

export async function shopNowAction(input: {
  id: number;
  quantity?: number;
  emptyCart?: boolean;
}): Promise<StoreCart> {
  const quantity = Math.max(1, Number(input.quantity) || 1);
  try {
    if (input.emptyCart) {
      await clearStoreCart();
    }
    return await addStoreCartItem({ id: input.id, quantity });
  } catch (error) {
    throw new Error(actionError(error));
  }
}

export async function updateCartItemAction(input: {
  key: string;
  quantity: number;
}): Promise<StoreCart> {
  try {
    if (input.quantity <= 0) return await removeStoreCartItem(input.key);
    return await updateStoreCartItem(input);
  } catch (error) {
    throw new Error(actionError(error));
  }
}

export async function removeCartItemAction(key: string): Promise<StoreCart> {
  try {
    return await removeStoreCartItem(key);
  } catch (error) {
    throw new Error(actionError(error));
  }
}

export async function applyCouponAction(code: string): Promise<StoreCart> {
  try {
    return await applyStoreCoupon(code.trim());
  } catch (error) {
    throw new Error(actionError(error));
  }
}

export async function removeCouponAction(code: string): Promise<StoreCart> {
  try {
    return await removeStoreCoupon(code);
  } catch (error) {
    throw new Error(actionError(error));
  }
}

export async function updateCustomerAction(input: {
  shipping: Address;
  billing: Address;
}): Promise<StoreCart> {
  try {
    return await updateStoreCustomer(input);
  } catch (error) {
    throw new Error(actionError(error));
  }
}

export async function selectShippingRateAction(input: {
  packageId: number;
  rateId: string;
}): Promise<StoreCart> {
  try {
    return await selectStoreShippingRate(input);
  } catch (error) {
    throw new Error(actionError(error));
  }
}

export async function migrateLegacyCartAction(
  items: Array<{ productId: string; quantity: number }>,
): Promise<StoreCart> {
  if (!isWooConfigured() || !items.length) {
    return getCartAction();
  }
  try {
    let cart = await getStoreCart();
    if (cart.items.length) return cart;
    for (const item of items) {
      const id = Number(item.productId);
      const quantity = Math.max(1, Number(item.quantity) || 1);
      if (!Number.isFinite(id) || id <= 0) continue;
      cart = await addStoreCartItem({ id, quantity });
    }
    return cart;
  } catch {
    return emptyStoreCart();
  }
}

export async function emptyCartAction(): Promise<StoreCart> {
  try {
    return await clearStoreCart();
  } catch {
    return emptyStoreCart();
  }
}
