import type { Metadata } from "next";
import { Clock, Mail, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import {
  BusinessStrip,
  EditorialHero,
  EditorialShell,
} from "@/components/EditorialPage";
import { SmoothAccordion } from "@/components/SmoothAccordion";
import { getSiteSettings } from "@/lib/api";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Email, phone, live chat, and a message form for Orvexo Electronics customer support.",
};

export default async function ContactPage({
  variant = "contact",
}: {
  variant?: "contact" | "help";
} = {}) {
  const settings = await getSiteSettings();
  const page = settings.pages.contact;
  const contact = settings.contact;
  const help = variant === "help";

  return (
    <EditorialShell>
      <EditorialHero
        current={help ? "Order Help Center" : "Contact"}
        eyebrow={`${settings.name} · ${help ? "Customer care" : page.eyebrow}`}
        title={page.title}
        description={page.intro}
      />
      <BusinessStrip settings={settings} />

      {page.channels?.length ? (
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {page.channels.map((channel) => {
            const Icon = channelIcon(channel.title);
            return (
              <div key={channel.title} className="surface-card space-y-3 p-6">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
                  <Icon className="size-4" aria-hidden />
                </span>
                <h2 className="text-lg tracking-tight">{channel.title}</h2>
                <p className="text-sm font-medium text-foreground">{channel.detail}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {channel.text}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.7fr)] lg:gap-10">
        <div className="surface-card p-6 sm:p-8">
          <h2 className="font-display text-2xl tracking-tight">Send us a message</h2>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-muted-foreground">
            {page.formNote || "Opens your email app with the note filled in."}
          </p>
          <ContactForm to={contact.email} />
          {page.securityNote ? (
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {page.securityNote}
            </p>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          {page.hours?.length ? (
            <div className="surface-card overflow-hidden">
              <h2 className="border-b border-border px-5 py-4 font-display text-xl tracking-tight">
                Customer support hours
              </h2>
              <ul>
                {page.hours.map((row) => (
                  <li
                    key={row.channel}
                    className="flex items-start justify-between gap-4 border-b border-border px-5 py-3 text-sm last:border-b-0"
                  >
                    <span>{row.channel}</span>
                    <span className="text-right text-muted-foreground">
                      {row.availability}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {page.businessNote ? (
            <p className="rounded-2xl border border-border bg-muted/40 p-5 text-sm leading-relaxed text-muted-foreground">
              {page.businessNote}
            </p>
          ) : null}
        </aside>
      </div>

      {page.helpTopics?.length ? (
        <div className="mt-14 space-y-4">
          <h2 className="font-display text-2xl tracking-tight">How can we help you?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {page.helpTopics.map((topic) => (
              <div key={topic.title} className="surface-card space-y-2 p-6">
                <h3 className="text-base tracking-tight">{topic.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {topic.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {page.faqs?.length ? (
        <div className="mt-14 space-y-4">
          <h2 className="font-display text-2xl tracking-tight">
            Frequently asked questions
          </h2>
          <SmoothAccordion
            items={page.faqs.map((item) => ({
              title: item.question,
              content: item.answer,
            }))}
          />
        </div>
      ) : null}
    </EditorialShell>
  );
}

function channelIcon(title: string) {
  const label = title.toLowerCase();
  if (label.includes("phone")) return Phone;
  if (label.includes("chat")) return MessageCircle;
  if (label.includes("hour")) return Clock;
  return Mail;
}
