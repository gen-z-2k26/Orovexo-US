"use client";

import { addItemToCartAction } from "@/app/actions/cart";
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
