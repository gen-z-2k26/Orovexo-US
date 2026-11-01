import type { Metadata } from "next";
import { Mail, Package, Truck } from "lucide-react";
import { TrackOrderForm } from "@/components/TrackOrderForm";
import { getSiteSettings } from "@/lib/api";
import { pageContainer } from "@/lib/layout";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Look up a guest order with your order number, order key, and billing email.",
};

const steps = [
  {
    icon: Mail,
    title: "Open the email",
    text: "The confirmation has the order number, order key, and billing email.",
  },
  {
    icon: Package,
    title: "Match the details",
    text: "Use the same email you entered at checkout. The key starts with wc_order_.",
  },
  {
    icon: Truck,
    title: "See the status",
    text: "Paid orders stay in processing until the carrier picks them up.",
  },
];

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const settings = await getSiteSettings();
  const query = await searchParams;
  const value = (key: string) => {
    const raw = query[key];
    return Array.isArray(raw) ? raw[0] || "" : raw || "";
  };

  return (
    <div className="pb-16">
      <section className="bg-foreground text-background">
        <div className={pageContainer("py-12 text-center sm:py-16")}>
          <p className="text-xs font-semibold tracking-[0.22em] uppercase text-background/70">
            {settings.name}
          </p>
          <h1 className="mt-3 font-display text-4xl text-background sm:text-6xl">
            Track your order
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-base text-background/85">
            Look up a guest order with the number, key, and email from your confirmation.
          </p>
        </div>
      </section>

      <div className={pageContainer("space-y-8 pt-8 sm:pt-10")}>
        <ol className="grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-foreground/15 bg-card p-5"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                {index + 1}
              </span>
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <step.icon className="size-4" aria-hidden />
                {step.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/75">
                {step.text}
              </p>
            </li>
          ))}
        </ol>

        <TrackOrderForm
          initialOrderId={value("order") || value("id")}
          initialOrderKey={value("key")}
          initialEmail={value("email")}
        />

        {settings.contact.email || settings.contact.phone ? (
          <p className="text-sm text-foreground/80">
            Still stuck?{" "}
            {settings.contact.email ? (
              <a
                className="font-semibold text-foreground underline underline-offset-2"
                href={`mailto:${settings.contact.email}`}
              >
                {settings.contact.email}
              </a>
            ) : null}
            {settings.contact.email && settings.contact.phone ? " or " : null}
            {settings.contact.phone ? (
              <span className="font-semibold text-foreground">{settings.contact.phone}</span>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}
