import type { Metadata } from "next";
import { CustomerCareShell, RelatedLinks } from "@/components/CustomerCarePage";
import { TrackOrderForm } from "@/components/TrackOrderForm";
import { getSiteSettings } from "@/lib/api";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Look up a guest order with your order number, order key, and billing email.",
};

export default async function TrackOrderPage() {
  const settings = await getSiteSettings();

  return (
    <CustomerCareShell
      settings={settings}
      variant="help"
      title="Track Your Order"
      eyebrow="Customer care"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start">
        <div className="rounded-2xl border border-border border-t-4 border-t-[var(--fp-bar)] bg-card p-6 sm:p-8">
          <TrackOrderForm />
        </div>
        <aside className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <div className="rounded-[3px] border border-border p-6">
            <h2 className="font-display mb-2 text-xl text-foreground">
              Where to find your details
            </h2>
            <p>
              The order number and order key are in the confirmation email sent after checkout.
            </p>
            <p className="mt-2">
              Use the same billing email you entered when you placed the order.
            </p>
          </div>
          <div className="rounded-[3px] border border-border p-6">
            <h2 className="font-display mb-2 text-xl text-foreground">
              If tracking is not ready
            </h2>
            <p>
              Carrier updates often appear 24–48 hours after the package is picked up.
            </p>
            <p className="mt-2">
              Still stuck? Email {settings.contact.email} or call {settings.contact.phone}.
            </p>
          </div>
        </aside>
      </div>
      <RelatedLinks settings={settings} href="/track-your-order" />
    </CustomerCareShell>
  );
}
