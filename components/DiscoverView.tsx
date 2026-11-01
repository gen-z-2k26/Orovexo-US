import type { ReactNode } from "react";
import Link from "next/link";
import { ContactForm, SubjectChips } from "@/components/ContactForm";
import {
  BlockView,
  CustomerCareShell,
  RelatedLinks,
  RichText,
} from "@/components/CustomerCarePage";
import { CARE_LABEL_HREFS } from "@/lib/customer-care";
import type { CareBlock, CarePage, CareSection } from "@/lib/customer-care";
import type { StoreSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

function copyrightFrom(page: CarePage) {
  return page.sections
    .flatMap((section) => section.blocks)
    .find((block) => block.type === "paragraph" && block.text.startsWith("©"));
}

function withoutCopyright(blocks: CareBlock[]) {
  return blocks.filter(
    (block) => !(block.type === "paragraph" && block.text.startsWith("©")),
  );
}

function SectionBody({
  section,
  contactStyle = "card",
  numbered,
  index,
}: {
  section: CareSection;
  contactStyle?: "card" | "grid" | "panel";
  numbered?: boolean;
  index?: number;
}) {
  const blocks = withoutCopyright(section.blocks);
  return (
    <section
      id={section.id}
      className="group scroll-mt-32 mb-0 border-b border-border py-10 last:border-b-0 sm:py-16"
    >
      <h2 className="font-display mb-4 text-[28px] leading-tight font-normal sm:text-[32px]">
        {numbered ? (
          <span className="flex gap-4">
            <span className="text-primary/80 tabular-nums">
              {String((index ?? 0) + 1).padStart(2, "0")}
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
}

function FooterNote({ page }: { page: CarePage }) {
  const copy = copyrightFrom(page);
  if (!copy || copy.type !== "paragraph") return null;
  return (
    <p className="mt-14 border-t border-border pt-5 text-[11px] text-muted-foreground">
      {copy.text}
    </p>
  );
}

function pullQuoteBlocks(section: CareSection) {
  const quote = "But finding the right product shouldn't feel complicated.";
  return section.blocks.map((block, index) => {
    if (block.type === "paragraph" && block.text === quote) {
      return (
        <blockquote
          key={quote}
          className="font-display my-6 max-w-[20ch] text-3xl leading-tight sm:text-4xl"
        >
          {quote}
        </blockquote>
      );
    }
    return (
      <BlockView key={`${section.id}-${index}`} block={block} contactStyle="grid" />
    );
  });
}

function offerCards(section: CareSection) {
  const bullets = section.blocks.find((block) => block.type === "bullets");
  const rest = section.blocks.filter((block) => block.type !== "bullets");
  return (
    <>
      {rest.map((block, index) => (
        <BlockView key={index} block={block} contactStyle="grid" />
      ))}
      {bullets && bullets.type === "bullets" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {bullets.items.map((item) => {
            const split = item.split(": ");
            const title = split.length > 1 ? split[0] : item;
            const body = split.length > 1 ? split.slice(1).join(": ") : "";
            return (
              <article key={item} className="rounded-2xl border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-card p-5">
                <h3 className="font-display text-xl">{title}:</h3>
                {body ? <p className="mt-2 text-[16px] leading-[1.7] text-muted-foreground">{body}</p> : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </>
  );
}

function headingCards(section: CareSection) {
  const groups: Array<{ title: string; blocks: CareBlock[] }> = [];
  const loose: CareBlock[] = [];
  for (const block of withoutCopyright(section.blocks)) {
    if (block.type === "heading") groups.push({ title: block.text, blocks: [] });
    else if (groups.length) groups[groups.length - 1].blocks.push(block);
    else loose.push(block);
  }
  return (
    <>
      {loose.map((block, index) => (
        <BlockView key={`loose-${index}`} block={block} contactStyle="grid" />
      ))}
      <div className="grid gap-3 md:grid-cols-3">
        {groups.map((group) => (
          <article key={group.title} className="rounded-2xl border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-card p-5">
            <h3 className="font-display text-xl">{group.title}</h3>
            {group.blocks.map((block, index) =>
              block.type === "paragraph" && CARE_LABEL_HREFS[block.text] ? (
                <p key={index} className="mt-4">
                  <Link href={CARE_LABEL_HREFS[block.text]} className="inline-flex min-h-11 items-center rounded-full bg-foreground px-4 text-sm text-background">
                    {block.text}
                  </Link>
                </p>
              ) : (
                <BlockView key={index} block={block} contactStyle="grid" />
              ),
            )}
          </article>
        ))}
      </div>
    </>
  );
}

function typographicBand(section: CareSection) {
  return withoutCopyright(section.blocks).map((block, index) => {
    if (block.type === "heading") {
      return (
        <p key={block.text} className="font-display my-4 text-4xl leading-tight sm:text-6xl">
          {block.text}
        </p>
      );
    }
    return <BlockView key={index} block={block} contactStyle="grid" />;
  });
}

export function DiscoverAbout({
  page,
  settings,
}: {
  page: CarePage;
  settings: StoreSettings;
}) {
  const [lead, ...restIntro] = page.intro;
  const mission = page.sections.find((section) => section.id === "our-mission");
  const vision = page.sections.find((section) => section.id === "our-vision");
  const skipped = new Set(["our-mission", "our-vision"]);
  return (
    <CustomerCareShell
      settings={settings}
      variant="brand"
      title={page.tagline || page.title}
      eyebrow="About Us"
      intro={
        lead ? (
          <p className="font-display text-2xl leading-snug text-foreground">
            <RichText text={lead} />
          </p>
        ) : null
      }
    >
      {restIntro.length ? (
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {restIntro.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="text-[16px] leading-[1.7] text-muted-foreground sm:text-[17px]">
              <RichText text={paragraph} />
            </p>
          ))}
        </div>
      ) : null}
      {page.sections.map((section, index) => {
        if (skipped.has(section.id)) {
          if (section.id !== "our-mission" || !mission || !vision) return null;
          return (
            <div key="mission-vision" className="grid gap-4 py-10 sm:grid-cols-2 sm:py-16">
              {[mission, vision].map((item, panel) => (
                <section key={item.id} id={item.id} className={panel === 0 ? "rounded-2xl bg-muted/50 p-6" : "rounded-2xl bg-primary/15 p-6"}>
                  <h2 className="font-display mb-4 text-[28px]">{item.title}</h2>
                  {withoutCopyright(item.blocks).map((block, blockIndex) => (
                    <BlockView key={blockIndex} block={block} contactStyle="grid" />
                  ))}
                </section>
              ))}
            </div>
          );
        }
        return (
          <section
            key={section.id}
            id={section.id}
            className={`scroll-mt-32 py-10 sm:py-16 ${index % 2 === 1 ? "bg-muted/30" : ""}`}
          >
            <h2 className="font-display mb-4 text-[28px] sm:text-[32px]">{section.title}</h2>
            {section.id === "our-story"
              ? pullQuoteBlocks(section)
              : section.id === "what-we-offer"
                ? offerCards(section)
                : section.id === "the-values-behind-orvexo" || section.id === "why-shop-with-orvexo-electronics"
                  ? headingCards(section)
                  : section.id === "a-shopping-experience-designed-around-you"
                    ? typographicBand(section)
                    : withoutCopyright(section.blocks).map((block, blockIndex) => (
                        <BlockView key={blockIndex} block={block} contactStyle="grid" />
                      ))}
          </section>
        );
      })}
      <FooterNote page={page} />
      <RelatedLinks settings={settings} href="/about-us" />
    </CustomerCareShell>
  );
}

export function DiscoverContact({
  page,
  settings,
}: {
  page: CarePage;
  settings: StoreSettings;
}) {
  const getInTouch = page.sections.find((section) => section.id === "get-in-touch");
  const rest = page.sections.filter((section) => section.id !== "get-in-touch");
  const send = rest.find((section) => section.id === "send-us-a-message");
  const other = rest.filter((section) => section.id !== "send-us-a-message");

  const channels: Array<{ title: string; blocks: CareBlock[] }> = [];
  if (getInTouch) {
    let current: { title: string; blocks: CareBlock[] } | null = null;
    for (const block of getInTouch.blocks) {
      if (block.type === "heading") {
        current = { title: block.text, blocks: [] };
        channels.push(current);
      } else if (current) {
        current.blocks.push(block);
      } else {
        channels.push({ title: getInTouch.title, blocks: [block] });
      }
    }
  }

  return (
    <CustomerCareShell
      settings={settings}
      variant="help"
      title={page.title}
      eyebrow={page.tagline || "We're Here to Help"}
      intro={page.intro.map((paragraph) => (
        <p key={paragraph.slice(0, 40)}>
          <RichText text={paragraph} />
        </p>
      ))}
    >
      {channels.length ? (
        <div className="mb-14 grid items-start gap-8 lg:grid-cols-2">
          <div>
          <h2 className="font-display mb-6 text-[28px] sm:text-[32px]">{getInTouch?.title}</h2>
          <div className="grid gap-4">
            {channels.map((channel, index) => (
              <div
                key={channel.title}
                className="rounded-[3px] border border-border p-6"
              >
                <p className="mb-3 text-[10px] font-bold tracking-[0.16em] text-foreground uppercase">
                  {String(index + 1).padStart(2, "0")} / {channel.title}
                </p>
                {channel.blocks.map((block, blockIndex) => (
                  <BlockView
                    key={`${channel.title}-${blockIndex}`}
                    block={block}
                    contactStyle="grid"
                  />
                ))}
              </div>
            ))}
          </div>
          </div>
          {send ? (
            <section id={send.id} className="scroll-mt-32 rounded-2xl border border-border border-t-4 border-t-[var(--fp-bar)] bg-card p-6 sm:p-8">
              <h2 className="font-display mb-3 text-[28px]">{send.title}</h2>
              {withoutCopyright(send.blocks).map((block, index) => (
                <BlockView key={index} block={block} contactStyle="grid" />
              ))}
              <SubjectChips
                topics={
                  page.sections
                    .find((section) => section.id === "how-can-we-help-you")
                    ?.blocks.filter((block) => block.type === "heading")
                    .map((block) => (block.type === "heading" ? block.text : ""))
                    .filter(Boolean) ?? []
                }
              />
              <ContactForm to={settings.contact.email} />
            </section>
          ) : null}
        </div>
      ) : null}

      {other.map((section) => (
        <SectionBody
          key={section.id}
          section={section}
          contactStyle="grid"
        />
      ))}

      <FooterNote page={page} />
      <RelatedLinks settings={settings} href="/contact-us" />
    </CustomerCareShell>
  );
}

export function DiscoverCommitment({
  page,
  settings,
}: {
  page: CarePage;
  settings: StoreSettings;
}) {
  return (
    <CustomerCareShell
      settings={settings}
      variant="brand"
      title={page.tagline || page.title}
      eyebrow="Our Commitment"
      intro={page.intro.map((paragraph) => (
        <p key={paragraph.slice(0, 40)}>
          <RichText text={paragraph} />
        </p>
      ))}
    >
      {page.sections.map((section, index) => (
        <SectionBody
          key={section.id}
          section={section}
          numbered
          index={index}
          contactStyle="grid"
        />
      ))}
      <FooterNote page={page} />
      <RelatedLinks settings={settings} href="/our-commitment" />
    </CustomerCareShell>
  );
}

export function DiscoverFaqFrame({
  page,
  settings,
  children,
}: {
  page: CarePage;
  settings: StoreSettings;
  children: ReactNode;
}) {
  return (
    <CustomerCareShell
      settings={settings}
      variant="help"
      title={page.title}
      eyebrow={page.tagline}
      intro={page.intro
        .filter((paragraph) => !paragraph.startsWith("Email:") && !paragraph.startsWith("Phone:") && !paragraph.startsWith("Live Chat:"))
        .map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>
            <RichText text={paragraph} />
          </p>
        ))}
    >
      {page.intro.some((paragraph) => paragraph.startsWith("Email:")) ? (
        <p className="mb-10 text-sm text-muted-foreground">
          {page.intro
            .filter((paragraph) =>
              paragraph.startsWith("Email:") ||
              paragraph.startsWith("Phone:") ||
              paragraph.startsWith("Live Chat:"),
            )
            .map((paragraph) => (
              <span key={paragraph} className="mr-6 inline-block">
                <RichText text={paragraph} />
              </span>
            ))}
        </p>
      ) : null}
      {children}
      <p className="mt-14">
        <Link href="/contact-us" className="text-sm underline underline-offset-4">
          Contact Customer Support
        </Link>
      </p>
      <FooterNote page={page} />
      <RelatedLinks settings={settings} href="/faqs" />
    </CustomerCareShell>
  );
}

export function sectionClassName(last?: boolean) {
  return cn(
    "scroll-mt-24 mb-10 border-b border-border pb-10",
    last && "mb-0 border-b-0 pb-0",
  );
}
