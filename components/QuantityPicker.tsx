"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QuantityPickerProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  size?: "sm" | "default";
  className?: string;
};

export function QuantityPicker({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  id,
  "aria-label": ariaLabel = "Quantity",
  size = "default",
  className,
}: QuantityPickerProps) {
  const current = Number.isFinite(value) ? value : min;
  const canDecrease = !disabled && current > min;
  const canIncrease = !disabled && current < max;

  function setValue(next: number) {
    const clamped = Math.max(min, Math.min(max, next));
    if (clamped !== current) onChange(clamped);
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-2xl border border-border bg-background",
        size === "sm" ? "h-8 px-0.5" : "h-12 px-1.5",
        className,
      )}
    >
      <button
        type="button"
        id={id}
        aria-label={`Decrease ${ariaLabel.toLowerCase()}`}
        disabled={!canDecrease}
        onClick={() => setValue(current - 1)}
        className={cn(
          "inline-flex items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40",
          size === "sm" ? "size-7" : "size-9",
        )}
      >
        <Minus className={size === "sm" ? "size-3.5" : "size-4"} />
      </button>
      <span
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "text-center font-semibold tabular-nums",
          size === "sm" ? "w-7 text-xs" : "w-8 text-sm",
        )}
      >
        {current}
      </span>
      <button
        type="button"
        aria-label={`Increase ${ariaLabel.toLowerCase()}`}
        disabled={!canIncrease}
        onClick={() => setValue(current + 1)}
        className={cn(
          "inline-flex items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40",
          size === "sm" ? "size-7" : "size-9",
        )}
      >
        <Plus className={size === "sm" ? "size-3.5" : "size-4"} />
      </button>
    </div>
  );
}
