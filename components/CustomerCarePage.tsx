import type { ReactNode } from "react";
import Link from "next/link";
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
      <Link href={href} className="underline decoration-muted-foreground/60 underline-offset-[3px] hover:text-primary">
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className="underline decoration-muted-foreground/60 underline-offset-[3px] hover:text-primary"
    >
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

function displayTitle(title: string) {
  const splits: Record<string, [string, string]> = {
    "Privacy Policy": ["Privacy", "Policy"],
    "Terms of Service": ["Terms", "of Service"],
    "Cookie Policy": ["Cookie", "Policy"],
    "Legal Notice": ["Legal", "Notice"],
    "Accessibility Statement": ["Accessibility", "Statement"],
    "Your Privacy Choices": ["Your Privacy", "Choices"],
  };
  return splits[title] ?? null;
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
      if (block.text.startsWith("Important:")) {
        return (
          <div className="my-4 border-l-2 border-primary bg-muted/60 px-5 py-4 text-[13px] leading-relaxed text-muted-foreground">
            <RichText text={block.text} />
          </div>
        );
      }
      return (
        <p className="mb-3.5 text-[15px] leading-[1.75] text-muted-foreground">
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
        <h3 className="font-display mt-6 mb-3 text-[21px] font-normal tracking-tight">
          <RichText text={block.text} />
        </h3>
      );
    case "bullets":
      return (
        <ul className="mb-3.5 list-disc space-y-1.5 pl-[22px] text-[15px] leading-[1.75] text-muted-foreground">
          {block.items.map((item) => (
            <li key={item}>
              <RichText text={item} />
            </li>
          ))}
        </ul>
      );
    case "numbered":
      return (
        <ol className="mb-3.5 list-decimal space-y-1.5 pl-[22px] text-[15px] leading-[1.75] text-muted-foreground">
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
          <p className="text-[15px] leading-[1.75] text-muted-foreground">
            <RichText text={block.answer} />
          </p>
        </div>
      );
    case "table":
      return (
        <div className="mb-5 overflow-hidden rounded-[3px] border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                {block.headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 font-medium text-foreground"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={`${row.label}-${row.value}`} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <RichText text={row.label} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
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
      if (contactStyle === "grid") {
        return (
          <div className="mt-6 grid gap-6 border-t border-border pt-8 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.label}>
                <span className="mb-1 block text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                  {field.label}
                </span>
                {field.href ? (
                  <Linked href={field.href}>{field.value}</Linked>
                ) : (
                  <p className="m-0 text-sm leading-relaxed">{field.value}</p>
                )}
              </div>
            ))}
          </div>
        );
      }
      if (contactStyle === "panel") {
        return (
          <div className="mt-6 rounded-[3px] border border-border bg-muted/50 px-6 py-6">
            <p className="font-display mb-4 text-2xl">Accessibility support</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.label}>
                  <span className="mb-0.5 block text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                    {field.label}
                  </span>
                  {field.href ? (
                    <Linked href={field.href}>{field.value}</Linked>
                  ) : (
                    <p className="m-0 text-sm leading-relaxed">{field.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
      return (
        <div className="mt-4 rounded-[3px] bg-foreground px-6 py-6 text-background">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.label}>
                <span className="mb-0.5 block text-[9px] font-bold tracking-[0.14em] text-background/60 uppercase">
                  {field.label}
                </span>
                {field.href ? (
                  <Linked href={field.href}>{field.value}</Linked>
                ) : (
                  <p className="m-0 text-[13px] leading-relaxed text-background/85">
                    {field.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

export function CustomerCareShell({
  settings,
  title,
  eyebrow,
  intro,
  effectiveDate,
  children,
  toc,
  tocLabel = "In this policy",
}: {
  settings: StoreSettings;
  title: string;
  eyebrow?: string;
  intro?: ReactNode;
  effectiveDate?: string;
  children: ReactNode;
  toc?: Array<{ id: string; title: string }>;
  tocLabel?: string;
}) {
  const split = displayTitle(title);
  const ampersand = title.split(" & ");
  return (
    <div className={pageContainer("py-12 sm:py-16")}>
      <div className="flex items-center justify-between gap-6 border-b border-border pb-5 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        <Link href="/" className="text-[13px] tracking-[0.25em] text-foreground">
          {settings.name}
        </Link>
        <span>{settings.tagline}</span>
      </div>

      <header className="mx-auto max-w-3xl py-12 text-center sm:py-16">
        {eyebrow ? (
          <p className="mb-4 text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.04] font-normal tracking-[-0.045em]">
          {split ? (
            <>
              {split[0]}
              <br />
              {split[1]}
            </>
          ) : ampersand.length === 2 ? (
            <>
              {ampersand[0]}
              <br />
              & {ampersand[1]}
            </>
          ) : (
            title
          )}
        </h1>
        {intro ? (
          <div className="mx-auto mt-6 max-w-2xl space-y-3.5 text-base leading-[1.75] text-muted-foreground sm:text-[17px]">
            {intro}
          </div>
        ) : null}
        {effectiveDate ? (
          <p className="mt-6 inline-flex items-center gap-2.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            {effectiveDate}
          </p>
        ) : null}
      </header>

      {toc?.length ? (
        <div className="grid items-start gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-[62px]">
          <nav
            aria-label="In this policy"
            className="rounded-[3px] border border-border bg-card/70 p-5 lg:sticky lg:top-24"
          >
            <p className="mb-3 text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
              {tocLabel}
            </p>
            <div className="grid grid-cols-2 gap-x-4 lg:grid-cols-1">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block py-1.5 text-xs leading-snug text-muted-foreground hover:text-primary hover:underline hover:underline-offset-[3px]"
                >
                  {item.title}
                </a>
              ))}
            </div>
          </nav>
          <article className="min-w-0">{children}</article>
        </div>
      ) : (
        <article className="min-w-0">{children}</article>
      )}
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
  const showToc = layout === "policy";
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
    >
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
              "scroll-mt-24 border-b border-border pb-8 mb-8",
              index === page.sections.length - 1 && "mb-0 border-b-0 pb-0",
            )}
          >
            <h2 className="font-display mb-3.5 text-[27px] leading-tight font-normal tracking-[-0.025em]">
              {numbered ? (
                <span className="flex gap-4">
                  <span className="text-primary/80 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{section.title.replace(/^\d+\.\s+/, "")}</span>
                </span>
              ) : (
                section.title
              )}
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
    </CustomerCareShell>
  );
}
