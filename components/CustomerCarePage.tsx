import type { ReactNode } from "react";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import {
  BackToTop,
  CopyAnchor,
  PolicyToc,
  PrintButton,
} from "@/components/footer-pages/Chrome";
import {
  CARE_LABEL_HREFS,
  hrefForAbsoluteUrl,
  type CareBlock,
  type CarePage,
} from "@/lib/customer-care";
import { pageContainer } from "@/lib/layout";
import type { CareLayout } from "@/lib/trust";
import type { StoreSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const URL_RE = /(https?:\/\/[^\s]+)/g;
const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_RE = /^\+?[\d\s().-]{10,}$/;

function isInternalHref(href: string) {
  return href.startsWith("/");
}

function Linked({ href, children }: { href: string; children: ReactNode }) {
  if (isInternalHref(href)) {
    return (
      <Link href={href} className="fp-link">
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className="fp-link">

      {children}
    </a>
  );
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const exact = CARE_LABEL_HREFS[text];
  if (exact) {
    return (
      <span className={className}>
        <Linked href={exact}>{text}</Linked>
      </span>
    );
  }

  const parts = text.split(URL_RE);
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.match(URL_RE)) {
          const href = hrefForAbsoluteUrl(part);
          return (
            <Linked key={`${part}-${index}`} href={href}>
              {part}
            </Linked>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

const bodyText =
  "mb-4 max-w-[68ch] text-[16px] leading-[1.7] text-muted-foreground sm:text-[17px]";

function splitLabel(item: string) {
  const index = item.indexOf(": ");
  if (index < 2 || index > 48) return null;
  return { label: item.slice(0, index), rest: item.slice(index + 2) };
}

export function BlockView({
  block,
  contactStyle = "card",
}: {
  block: CareBlock;
  contactStyle?: "card" | "grid" | "panel";
}) {
  switch (block.type) {
    case "paragraph":
      if (CARE_LABEL_HREFS[block.text]) {
        return (
          <p className="my-3">
            <Linked href={CARE_LABEL_HREFS[block.text]}>
              <span className="inline-flex min-h-11 items-center rounded-full border border-foreground px-4 text-sm text-foreground">
                {block.text}
              </span>
            </Linked>
          </p>
        );
      }
      if (block.text.startsWith("Important:")) {
        return (
          <div className="my-4 max-w-[68ch] rounded-2xl border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] border-l-4 border-l-[var(--fp-bar)] bg-card px-5 py-4 text-[16px] leading-[1.7] sm:text-[17px]">
            <RichText text={block.text} />
          </div>
        );
      }
      return (
        <p className={bodyText}>
          <RichText text={block.text} />
        </p>
      );
    case "caption":
      return (
        <p className="mb-3 text-sm font-medium tracking-wide text-foreground">
          {block.text}
        </p>
      );
    case "heading":
      return (
        <h3 className="font-display mt-6 mb-3 text-[20px] font-normal tracking-tight">
          <RichText text={block.text} />
        </h3>
      );
    case "bullets": {
      const pairs = block.items.map(splitLabel);
      if (pairs.every(Boolean)) {
        return (
          <dl className="mb-4 max-w-[68ch] divide-y divide-border rounded-2xl border border-[color-mix(in_srgb,var(--accent)_40%,transparent)]">
            {block.items.map((item) => {
              const pair = splitLabel(item)!;
              return (
                <div key={item} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-4">
                  <dt className="font-medium text-foreground">{pair.label}:</dt>
                  <dd className="text-[16px] leading-[1.7] text-muted-foreground sm:text-[17px]">
                    <RichText text={pair.rest} />
                  </dd>
                </div>
              );
            })}
          </dl>
        );
      }
      return (
        <ul className="mb-4 max-w-[68ch] list-disc space-y-1.5 pl-[22px] text-[16px] leading-[1.7] text-muted-foreground sm:text-[17px]">
          {block.items.map((item) => (
            <li key={item}>
              <RichText text={item} />
            </li>
          ))}
        </ul>
      );
    }
    case "numbered":
      return (
        <ol className="mb-4 max-w-[68ch] list-decimal space-y-1.5 pl-[22px] text-[16px] leading-[1.7] text-muted-foreground sm:text-[17px]">
          {block.items.map((item) => (
            <li key={item}>
              <RichText text={item} />
            </li>
          ))}
        </ol>
      );
    case "faq":
      return (
        <div className="mb-5">
          <h3 className="font-display mb-2 text-[21px] font-normal tracking-tight">
            {block.question}
          </h3>
          <p className={bodyText}>
            <RichText text={block.answer} />
          </p>
        </div>
      );
    case "table":
      return (
        <div className="mb-5 overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--accent)_40%,transparent)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary/15">
              <tr>
                {block.headers.map((header) => (
                  <th key={header} className="px-4 py-3 font-medium text-foreground">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr
                  key={`${row.label}-${row.value}`}
                  className={cn(
                    "border-t border-border max-sm:block",
                    rowIndex % 2 === 1 && "bg-muted/30",
                  )}
                >
                  <td className="px-4 py-3 font-medium text-foreground max-sm:block max-sm:pb-0">
                    <RichText text={row.label} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-sm:block max-sm:pt-1">
                    <RichText text={row.value} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "contact": {
      const fields = block.fields.map((field) => {
        const value = field.value;
        let href: string | null = null;
        if (MAIL_RE.test(value)) href = `mailto:${value}`;
        else if (TEL_RE.test(value)) href = `tel:${value.replace(/[^\d+]/g, "")}`;
        else if (value.startsWith("http")) href = hrefForAbsoluteUrl(value);
        return { ...field, href };
      });
      const grid = (
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label}>
              <span className="mb-1 block text-[10px] font-bold tracking-[0.14em] uppercase opacity-70">
                {field.label}
              </span>
              {field.href ? (
                <Linked href={field.href}>
                  <span className="inline-flex min-h-11 items-center gap-2">
                    {field.href.startsWith("mailto:") ? <Mail className="size-4" aria-hidden /> : null}
                    {field.href.startsWith("tel:") ? <Phone className="size-4" aria-hidden /> : null}
                    {field.value}
                  </span>
                </Linked>
              ) : (
                <p className="m-0 text-sm leading-relaxed">{field.value}</p>
              )}
            </div>
          ))}
        </div>
      );
      if (contactStyle === "panel") {
        return (
          <div className="mt-6 rounded-2xl border border-border bg-muted/50 px-6 py-6">
            <p className="font-display mb-4 text-2xl">Accessibility support</p>
            {grid}
          </div>
        );
      }
      return (
        <div className={cn("mt-4 rounded-2xl px-6 py-6", contactStyle === "grid" ? "border border-border bg-card" : "bg-foreground text-background")}>
          {grid}
        </div>
      );
    }
    default:
      return null;
  }
}

export function PageHeader({
  eyebrow,
  title,
  intro,
  effectiveDate,
  actions,
  variant = "policy",
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  effectiveDate?: string;
  actions?: ReactNode;
  variant?: "brand" | "help" | "policy";
}) {
  const lead = variant === "help";
  return (
    <header className="mb-8 grid items-end gap-6 text-left lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        {eyebrow ? (
          <p className="mb-3 text-[11px] font-bold tracking-[0.16em] text-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="fp-h1 font-display">{title}</h1>
        {effectiveDate ? (
          <p className="mt-4 inline-flex rounded-full border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] px-3 py-1 text-xs">
            {effectiveDate}
          </p>
        ) : null}
        {actions ? <div className="mt-4">{actions}</div> : null}
      </div>
      {intro ? (
        <div className={cn("space-y-3 text-[16px] leading-[1.7] text-muted-foreground sm:text-[17px]", lead && "lg:text-[18px]")}>
          {intro}
        </div>
      ) : null}
    </header>
  );
}

export function RelatedLinks({
  settings,
  href,
}: {
  settings: StoreSettings;
  href: string;
}) {
  const column = settings.navigation.footerColumns.find((group) =>
    group.links.some((link) => link.href === href),
  );
  if (!column) return null;
  return (
    <nav data-ui-chrome="related" aria-label={column.title} className="mt-16 border-t border-border pt-8 print:hidden">
      <p className="mb-4 text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
        {column.title}
      </p>
      <ul className="flex flex-wrap gap-2">
        {column.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={link.href === href ? "page" : undefined}
              className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm aria-[current=page]:border-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function glanceRows(page: CarePage) {
  const rows = page.sections.flatMap((section) =>
    section.blocks.flatMap((block) => (block.type === "table" ? block.rows : [])),
  );
  const preferred = [
    "Standard Domestic Shipping",
    "Order Processing",
    "Shipping Transit",
    "Estimated Total Delivery",
  ];
  const picked = preferred
    .map((label) => rows.find((row) => row.label === label))
    .filter((row): row is { label: string; value: string } => Boolean(row));
  return (picked.length ? picked : rows).slice(0, 4);
}

export function AtAGlance({ page }: { page: CarePage }) {
  const rows = glanceRows(page);
  if (rows.length < 2) return null;
  return (
    <div data-ui-chrome="glance" className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {rows.map((row) => (
        <div
          key={`${row.label}-${row.value}`}
          className="rounded-2xl border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-card p-4"
        >
          <p className="text-[11px] font-bold tracking-[0.08em] text-foreground uppercase">
            <RichText text={row.label} />
          </p>
          <p className="font-display mt-2 text-xl">
            <RichText text={row.value} />
          </p>
        </div>
      ))}
    </div>
  );
}

function ShippingTimeline({ page }: { page: CarePage }) {
  if (page.slug !== "shipping-policy") return null;
  const rows = glanceRows(page).filter((row) =>
    ["Order Processing", "Shipping Transit", "Estimated Total Delivery"].includes(row.label),
  );
  if (rows.length < 3) return null;
  return (
    <ol data-ui-chrome="timeline" className="mb-10 grid gap-3 sm:grid-cols-3">
      {rows.map((row) => (
        <li key={row.label} className="rounded-2xl border-t-4 border-t-[var(--fp-bar)] bg-muted/40 px-4 py-3">
          <p className="text-sm font-medium">{row.label}</p>
          <p className="text-sm text-muted-foreground">{row.value}</p>
        </li>
      ))}
    </ol>
  );
}

export function CustomerCareShell({
  title,
  eyebrow,
  intro,
  effectiveDate,
  children,
  toc,
  tocLabel = "In this policy",
  actions,
  variant = "policy",
}: {
  title: string;
  eyebrow?: string;
  intro?: ReactNode;
  effectiveDate?: string;
  children: ReactNode;
  toc?: Array<{ id: string; title: string }>;
  tocLabel?: string;
  actions?: ReactNode;
  variant?: "brand" | "help" | "policy";
  settings?: StoreSettings;
}) {
  return (
    <div className={pageContainer("fp-page py-10 sm:py-14")}>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        intro={intro}
        effectiveDate={effectiveDate}
        actions={actions}
        variant={variant}
      />
      {toc?.length ? (
        <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-10">
          <PolicyToc items={toc} label={tocLabel} />
          <article className="min-w-0">{children}</article>
        </div>
      ) : (
        <article className="min-w-0">{children}</article>
      )}
      <BackToTop />
    </div>
  );
}

export function CustomerCarePage({
  page,
  settings,
  layout = "policy",
}: {
  page: CarePage;
  settings: StoreSettings;
  layout?: CareLayout;
}) {
  const help = page.slug === "order-help-center";
  const showToc = !help;
  const toc = showToc
    ? page.sections.map((section) => ({
        id: section.id,
        title: section.title.replace(/^\d+\.\s+/, ""),
      }))
    : undefined;
  const tocLabel =
    page.slug === "terms-of-service" ? "In these terms" : "In this policy";
  const copyright = page.sections
    .flatMap((section) => section.blocks)
    .filter((block) => block.type === "paragraph")
    .map((block) => (block.type === "paragraph" ? block.text : ""))
    .find((text) => text.startsWith("©"));

  const contactStyle =
    layout === "notice" ? "grid" : layout === "accessibility" ? "panel" : "card";

  const trustSlugs = new Set([
    "privacy-policy",
    "terms-of-service",
    "cookie-policy",
    "legal-notice",
    "accessibility-statement",
    "your-privacy-choices",
  ]);
  const eyebrow =
    layout === "accessibility"
      ? `${settings.name} / Accessibility Statement`
      : layout === "notice"
        ? "Important store information"
        : page.tagline ||
          (trustSlugs.has(page.slug) ? "Trust & transparency" : "Customer care");

  const headline =
    layout === "accessibility" && page.tagline ? page.tagline : page.title;

  return (
    <CustomerCareShell
      settings={settings}
      title={headline}
      eyebrow={eyebrow}
      effectiveDate={page.effectiveDate}
      intro={page.intro.map((paragraph) => (
        <p key={paragraph.slice(0, 40)}>
          <RichText text={paragraph} />
        </p>
      ))}
      toc={toc}
      tocLabel={tocLabel}
      variant={help ? "help" : "policy"}
      actions={
        help ? null : (
          <div className="flex flex-wrap gap-2">
            <PrintButton />
          </div>
        )
      }
    >
      {help ? null : <AtAGlance page={page} />}
      {help ? null : <ShippingTimeline page={page} />}
      {page.sections.map((section, index) => {
        const blocks = section.blocks.filter((block) => {
          if (block.type !== "paragraph") return true;
          return !block.text.startsWith("©");
        });
        const numbered = layout === "accessibility";
        return (
          <section
            key={section.id}
            id={section.id}
            className={cn(
              "group scroll-mt-32 border-b border-border py-10 sm:py-16",
              index === page.sections.length - 1 && "border-b-0",
            )}
          >
            <h2 className="font-display mb-4 flex items-start gap-2 text-[28px] leading-tight font-normal sm:text-[32px]">
              {numbered ? (
                <span className="grid flex-1 gap-2 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-4">
                  <span className="font-display text-4xl text-foreground/80 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{section.title}</span>
                </span>
              ) : (
                <span className="flex-1">{section.title}</span>
              )}
              <CopyAnchor id={section.id} />
            </h2>
            {blocks.map((block, blockIndex) => (
              <BlockView
                key={`${section.id}-${blockIndex}`}
                block={block}
                contactStyle={contactStyle}
              />
            ))}
          </section>
        );
      })}
      {copyright ? (
        <p className="mt-14 border-t border-border pt-5 text-[11px] text-muted-foreground">
          {copyright}
        </p>
      ) : null}
      <RelatedLinks settings={settings} href={`/${page.slug}`} />
    </CustomerCareShell>
  );
}
