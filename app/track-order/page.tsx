import type { Metadata } from "next";
import { pageContainer } from "@/lib/layout";
import { TrackOrderForm } from "@/components/TrackOrderForm";

export const metadata: Metadata = {
  title: "Track order",
  description: "Look up a guest order with your order number, order key, and billing email.",
  robots: { index: false, follow: true },
};

export default function TrackOrderPage() {
  return (
    <div className={pageContainer("py-16")}>
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm font-medium text-primary">Track order</p>
        <h1 className="mt-3 font-display text-balance text-4xl sm:text-5xl">
          Find your order
        </h1>
        <p className="mt-4 text-pretty text-muted-foreground">
          Use the order number, order key, and billing email from your confirmation.
        </p>
      </div>
      <div className="mt-10">
        <TrackOrderForm />
      </div>
    </div>
  );
}
