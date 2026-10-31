import type { ReactNode } from "react";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { buttonVariants } from "@/components/ui/button";
import { pageContainer } from "@/lib/layout";
import type { StoreSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EditorialShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={pageContainer(cn("py-10 sm:py-14", className))}>
      {children}
    </div>
  );
}

export function EditorialHero({
  current,
  eyebrow,
  title,
  description,
}: {
  current: string;
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-border pb-10">
      <PageHero
        current={current}
        eyebrow={eyebrow}
        title={title}
        description={description}
        wide
      />
    </div>
  );
}

export function BusinessStrip({ settings }: { settings: StoreSettings }) {
  const phoneHref = settings.contact.phone.replace(/[^\d+]/g, "");

  return (
    <aside className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3 sm:p-6">
      <div className="flex gap-3">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Business address
          </p>
          <p className="mt-1 text-sm leading-relaxed">
            {settings.contact.legalName ? (
              <>
                {settings.contact.legalName}
                <br />
              </>
            ) : null}
            {settings.contact.address}
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Email
          </p>
          <a
            href={`mailto:${settings.contact.email}`}
            className="mt-1 block text-sm hover:text-primary"
          >
            {settings.contact.email}
          </a>
        </div>
      </div>
      <div className="flex gap-3">
        <Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Phone
          </p>
          <a
            href={`tel:${phoneHref}`}
            className="mt-1 block text-sm hover:text-primary"
          >
            {settings.contact.phone}
          </a>
          {settings.contact.openingHours ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {settings.contact.openingHours}
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export function PageToc({
  items,
}: {
  items: Array<{ id: string; title: string }>;
}) {
  if (!items.length) return null;
  return (
    <nav
      aria-label="On this page"
      className="rounded-2xl border border-border bg-muted/30 p-5"
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        On this page
      </p>
      <ol className="mt-3 space-y-2 text-sm">
        {items.map((item, index) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="mr-2 tabular-nums text-xs text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EditorialCta({
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  body?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="mt-16 rounded-3xl border border-border bg-muted/40 px-6 py-10 text-center sm:px-10">
      <p className="font-display text-2xl sm:text-3xl">{title}</p>
      {body ? (
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {body}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={primaryHref} className={buttonVariants({ size: "lg" })}>
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function slugifySection(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
