import type { Metadata } from "next";
import { pageContainer } from "@/lib/layout";

export const metadata: Metadata = {
  title: "Track order",
  description: "Order tracking is coming soon.",
  robots: { index: false, follow: true },
};

export default function TrackOrderPage() {
  return (
    <div
      className={pageContainer(
        "flex min-h-[60dvh] flex-col items-center justify-center py-16 text-center",
      )}
    >
      <p className="text-sm font-medium text-primary">Track order</p>
      <h1 className="mt-3 font-display text-balance text-4xl font-semibold sm:text-5xl">
        Coming soon
      </h1>
      <p className="mt-4 max-w-md text-pretty text-muted-foreground">
        Order tracking is not available yet. Check back here when this feature
        is ready.
      </p>
    </div>
  );
}
