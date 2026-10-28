import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewStars({
  rating,
  size = "md",
  className,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const clamped = Math.min(5, Math.max(0, rating));
  const iconClass =
    size === "lg" ? "size-6" : size === "sm" ? "size-3.5" : "size-4";

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${clamped.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const filled = clamped >= index + 1;
        const partial = !filled && clamped > index;
        return (
          <Star
            key={index}
            className={cn(
              iconClass,
              filled || partial
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted",
            )}
            aria-hidden
          />
        );
      })}
    </span>
  );
}
