import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { PageHero } from "@/components/PageHero";
import { getSiteSettings } from "@/lib/api";
import { pageContainer } from "@/lib/layout";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Email, phone, live chat, and a message form for Orvexo Electronics customer support.",
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

      {page.channels?.length ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {page.channels.map((channel) => (
            <div key={channel.title} className="surface-card space-y-2 p-6">
              <h2 className="text-lg tracking-tight">{channel.title}</h2>
              <p className="text-sm font-medium text-foreground">{channel.detail}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {channel.text}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
        <aside className="surface-card h-fit space-y-4 p-6">
          <h2 className="text-lg tracking-tight">Our business information</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="text-foreground">Store name: {settings.name} Electronics</li>
            {contact.legalName ? (
              <li>Legal business name: {contact.legalName}</li>
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
            {settings.footer?.chatLine ? (
              <li>{settings.footer.chatLine}</li>
            ) : null}
          </ul>
          {page.businessNote ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {page.businessNote}
            </p>
          ) : null}
        </aside>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-lg tracking-tight">Send us a message</h2>
          <p className="mt-2 mb-6 text-sm text-muted-foreground">
            {page.formNote || "Opens your email app with the note filled in."}
          </p>
          <ContactForm to={contact.email} />
          {page.securityNote ? (
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {page.securityNote}
            </p>
          ) : null}
        </div>
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

      {page.hours?.length ? (
        <div className="mt-14 max-w-2xl space-y-4">
          <h2 className="font-display text-2xl tracking-tight">
            Customer support hours
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Support channel</th>
                  <th className="px-4 py-3 font-medium">Availability</th>
                </tr>
              </thead>
              <tbody>
                {page.hours.map((row) => (
                  <tr key={row.channel} className="border-t border-border">
                    <td className="px-4 py-3">{row.channel}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.availability}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {page.faqs?.length ? (
        <div className="mt-14 space-y-4">
          <h2 className="font-display text-2xl tracking-tight">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {page.faqs.map((item) => (
              <details key={item.question} className="group surface-card overflow-hidden">
                <summary className="cursor-pointer list-none px-5 py-4 font-medium tracking-tight marker:content-none [&::-webkit-details-marker]:hidden">
                  {item.question}
                </summary>
                <p className="border-t border-border px-5 py-4 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
