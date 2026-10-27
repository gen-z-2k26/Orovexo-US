"use client";

import { create } from "zustand";

export type ToastVariant = "success" | "error";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastState = {
  toasts: ToastItem[];
  show: (toast: Omit<ToastItem, "id"> & { id?: string }) => string;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (toast) => {
    const id = toast.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { ...toast, id }],
    }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

export function toast(input: {
  title: string;
  description?: string;
  variant?: ToastVariant;
}) {
  return useToastStore.getState().show({
    title: input.title,
    description: input.description,
    variant: input.variant ?? "success",
  });
}
