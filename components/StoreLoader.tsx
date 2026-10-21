import { cn } from "@/lib/utils";

export function StoreLoader({
  label = "Loading collection...",
  compact = false,
  className,
}: {
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "relative flex flex-col items-center justify-center gap-3.5 text-center",
        compact ? "py-6" : "py-12",
        className,
      )}
    >
      {/* Top indeterminate progress shimmer bar */}
      <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/15">
        <div className="h-full w-1/3 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>

      {/* Dual-ring orbital spinner with center pulse */}
      <div className="relative flex size-12 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary/60" />
        <span className="absolute inset-2 animate-[spin_1.4s_linear_infinite_reverse] rounded-full border border-transparent border-b-accent" />
        <span className="size-2.5 animate-pulse rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
      </div>

      {label ? (
        <div className="space-y-1">
          <p className="font-display text-sm font-semibold tracking-tight text-foreground">
            {label}
          </p>
          <p className="text-xs text-muted-foreground">
            Fetching live catalog from store
          </p>
        </div>
      ) : null}
    </div>
  );
}
