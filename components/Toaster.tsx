"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useToastStore, type ToastItem } from "@/lib/toast-store";
import { cn } from "@/lib/utils";

const DURATION_MS = 3800;

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(item.id), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [dismiss, item.id]);

  const Icon = item.variant === "error" ? CircleAlert : CircleCheck;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, y: -8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      role={item.variant === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-[min(100%,22rem)] gap-3 rounded-2xl border bg-card px-4 py-3 text-sm shadow-lg",
        item.variant === "error"
          ? "border-destructive/40"
          : "border-border",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          item.variant === "error" ? "text-destructive" : "text-primary",
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{item.title}</p>
        {item.description ? (
          <p className="mt-0.5 text-pretty text-muted-foreground">{item.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss notification"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 z-[200] flex flex-col items-end gap-2"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}
