import Link from "next/link";
import type { StoreSettings } from "@/lib/types";
import { pageContainer } from "@/lib/layout";

export function Footer({ settings }: { settings: StoreSettings }) {
  const columns =
    settings.navigation?.footerColumns?.length > 0
      ? settings.navigation.footerColumns
      : [];
  const blurb =
    settings.footer?.blurb ||
    `This is placeholder store info for ${settings.name}. Contact details are sample data for the demo.`;
  const trustLine =
    settings.footer?.trustLine ||
    "Free shipping · 30-day returns · Secure checkout";

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className={pageContainer("py-14 sm:py-16")}>
        <div
          className={
            columns.length
              ? "grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr] lg:gap-16"
              : "grid gap-12"
          }
        >
          <div className="space-y-5">
            <p className="text-xl tracking-tight">{settings.name}</p>
            <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
              {blurb}
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {settings.contact.legalName ? (
                <li>{settings.contact.legalName}</li>
              ) : null}
              <li>
                <a
                  href={`mailto:${settings.contact.email}`}
                  className="hover:text-foreground"
                >
                  {settings.contact.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${settings.contact.phone.replace(/\s+/g, "")}`}
                  className="hover:text-foreground"
                >
                  {settings.contact.phone}
                </a>
              </li>
              <li>{settings.contact.address}</li>
              {settings.contact.openingHours ? (
                <li>{settings.contact.openingHours}</li>
              ) : null}
              {settings.contact.vatNumber ? (
                <li>VAT: {settings.contact.vatNumber}</li>
              ) : null}
            </ul>
          </div>

          {columns.map((column) => (
            <div key={column.title} className="space-y-3">
              <p className="text-sm tracking-tight">{column.title}</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.name}. All rights reserved.
          </p>
          <p>{trustLine}</p>
        </div>
      </div>
    </footer>
  );
}
