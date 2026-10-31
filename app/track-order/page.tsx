import type { Metadata } from "next";
import { EditorialHero, EditorialShell } from "@/components/EditorialPage";
import { TrackOrderForm } from "@/components/TrackOrderForm";
import { getSiteSettings } from "@/lib/api";

export const metadata: Metadata = {
  title: "Track order",
  description: "Look up a guest order with your order number, order key, and billing email.",
  robots: { index: false, follow: true },
};

export default async function TrackOrderPage() {
  const settings = await getSiteSettings();

  return (
    <EditorialShell>
      <EditorialHero
        current="Track your order"
        eyebrow={`${settings.name} · Customer care`}
        title="Find your order"
        description="Use the order number, order key, and billing email from your confirmation."
      />
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start">
        <div className="surface-card p-6 sm:p-8">
          <TrackOrderForm />
        </div>
        <aside className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <div className="surface-card space-y-2 p-6">
            <h2 className="font-display text-xl text-foreground">Where to find your details</h2>
            <p>The order number and order key are in the confirmation email sent after checkout.</p>
            <p>Use the same billing email you entered when you placed the order.</p>
          </div>
          <div className="surface-card space-y-2 p-6">
            <h2 className="font-display text-xl text-foreground">If tracking is not ready</h2>
            <p>Carrier updates often appear 24-48 hours after the package is picked up.</p>
            <p>
              Still stuck? Email {settings.contact.email} or call {settings.contact.phone}.
            </p>
          </div>
        </aside>
      </div>
    </EditorialShell>
  );
}
