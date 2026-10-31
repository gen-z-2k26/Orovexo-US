import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { StoreSettings } from "@/lib/types";
import { BrandLogo } from "@/components/BrandLogo";
import { pageContainer } from "@/lib/layout";

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

export function Footer({ settings }: { settings: StoreSettings }) {
  const columns =
    settings.navigation?.footerColumns?.length > 0
      ? settings.navigation.footerColumns
      : [];
  const blurb =
    settings.footer?.blurb ||
    settings.tagline ||
    `This is placeholder store info for ${settings.name}.`;
  const contactTitle =
    settings.footer?.contactTitle || "Business Information";
  const chatLine = settings.footer?.chatLine;
  const phoneHref = settings.contact.phone.replace(/[^\d+]/g, "");

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className={pageContainer("py-12 sm:py-14")}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6 lg:gap-x-8">
          <div className="space-y-4 sm:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-flex items-center">
              <BrandLogo heightClass="h-9 sm:h-10" />
            </Link>
            <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              {blurb}
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.slug || column.title} className="space-y-3">
              <p className="text-sm font-medium tracking-tight">{column.title}</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    {isExternal(link.href) ? (
                      <a
                        href={link.href}
                        className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-3 lg:col-span-1">
            <p className="text-sm font-medium tracking-tight">{contactTitle}</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {settings.contact.address ? (
                <li className="flex gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{settings.contact.address}</span>
                </li>
              ) : null}
              {settings.contact.phone ? (
                <li className="flex gap-2.5">
                  <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <a href={`tel:${phoneHref}`} className="hover:text-foreground">
                    {settings.contact.phone}
                  </a>
                </li>
              ) : null}
              {settings.contact.email ? (
                <li className="flex gap-2.5">
                  <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <a
                    href={`mailto:${settings.contact.email}`}
                    className="hover:text-foreground"
                  >
                    {settings.contact.email}
                  </a>
                </li>
              ) : null}
              {settings.contact.openingHours ? (
                <li className="flex gap-2.5">
                  <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{settings.contact.openingHours}</span>
                </li>
              ) : null}
              {chatLine ? (
                <li className="flex gap-2.5">
                  <MessageCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{chatLine}</span>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {settings.contact.legalName || settings.name}.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
