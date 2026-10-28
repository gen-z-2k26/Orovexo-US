"use client";

import { addItemToCartAction, shopNowAction } from "@/app/actions/cart";
import { useCartStore } from "@/lib/cart-store";
import { toast } from "@/lib/toast-store";
import type { Product } from "@/lib/types";

export async function addProductToCart(product: Product, quantity = 1) {
  try {
    const cart = await addItemToCartAction({
      id: Number(product.id),
      quantity,
    });
    useCartStore.getState().setCart(cart, { open: true, bump: true });
    toast({
      title: "Added to cart",
      description:
        quantity > 1 ? `${product.name} (${quantity})` : product.name,
    });
    return cart;
  } catch (error) {
    toast({
      title: "Could not add to cart",
      description: error instanceof Error ? error.message : "Please try again.",
      variant: "error",
    });
    throw error;
  }
}

export async function shopNowToCheckout(
  product: Product,
  quantity = 1,
  emptyCart = false,
) {
  try {
    const cart = await shopNowAction({
      id: Number(product.id),
      quantity,
      emptyCart,
    });
    const store = useCartStore.getState();
    store.setCart(cart, { open: false, bump: true });
    store.openCheckout();
    return cart;
  } catch (error) {
    toast({
      title: "Could not start checkout",
      description: error instanceof Error ? error.message : "Please try again.",
      variant: "error",
    });
    throw error;
  }
}
