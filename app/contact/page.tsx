import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { PageHero } from "@/components/PageHero";
import { getSiteSettings } from "@/lib/api";
import { pageContainer } from "@/lib/layout";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact us",
  description: "Email, phone, and a message form for order questions.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const page = settings.pages.contact;
  const contact = settings.contact;

  return (
    <div className={pageContainer("py-10 sm:py-14")}>
      <PageHero
        current="Contact"
        eyebrow={`${settings.name} · ${page.eyebrow}`}
        title={page.title}
        description={page.intro}
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
        <aside className="surface-card h-fit space-y-4 p-6">
          <h2 className="text-lg tracking-tight">Store details</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {contact.legalName ? (
              <li className="text-foreground">{contact.legalName}</li>
            ) : null}
            <li>
              <a
                href={`mailto:${contact.email}`}
                className="hover:text-foreground"
              >
                {contact.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                className="hover:text-foreground"
              >
                {contact.phone}
              </a>
            </li>
            <li>{contact.address}</li>
            {contact.openingHours ? <li>{contact.openingHours}</li> : null}
          </ul>
        </aside>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-lg tracking-tight">Send a message</h2>
          <p className="mt-2 mb-6 text-sm text-muted-foreground">
            Opens your email app with the note filled in.
          </p>
          <ContactForm to={contact.email} />
        </div>
      </div>
    </div>
  );
}
