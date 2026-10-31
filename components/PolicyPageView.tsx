import { FaqAccordion } from "@/components/FaqAccordion";
import {
  BusinessStrip,
  EditorialCta,
  EditorialHero,
  EditorialShell,
  PageToc,
  slugifySection,
} from "@/components/EditorialPage";
import type { PolicyPageDef } from "@/lib/policy-pages";
import type { FaqGroup, StoreSettings } from "@/lib/types";

const CUSTOMER_CARE = new Set([
  "shipping-policy",
  "return-and-refund-policy",
  "cancellation-policy",
  "payment-policy",
  "buy-now-pay-later",
  "warranty",
]);

function sectionLabel(slug: string) {
  return CUSTOMER_CARE.has(slug) ? "Customer care" : "Trust & transparency";
}

export function PolicyPageView({
  policy,
  groups,
  settings,
}: {
  policy: PolicyPageDef;
  groups: FaqGroup[];
  settings?: StoreSettings;
}) {
  if (policy.designed && policy.sections?.length && settings) {
    const toc = policy.sections.map((section) => ({
      id: slugifySection(section.title),
      title: section.title,
    }));

    return (
      <EditorialShell>
        <EditorialHero
          current={policy.title}
          eyebrow={`${settings.name} · ${sectionLabel(policy.slug)}`}
          title={policy.title}
          description={policy.intro}
        />
        <BusinessStrip settings={settings} />
        <div className="mt-12 grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <PageToc items={toc} />
          </div>
          <div className="space-y-6">
            {policy.sections.map((section) => (
              <section
                key={section.title}
                id={slugifySection(section.title)}
                className="surface-card scroll-mt-24 space-y-4 p-6 sm:p-8"
              >
                <h2 className="font-display text-2xl tracking-tight">
                  {section.title}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 48)}
                    className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets?.length ? (
                  <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>
        <EditorialCta
          title="Questions about this page?"
          body="Our team can help with orders, product details, and the policies that apply to your purchase."
          primaryHref="/contact-us"
          primaryLabel="Contact us"
          secondaryHref="/faqs"
          secondaryLabel="Read the FAQ"
        />
      </EditorialShell>
    );
  }

  if (!settings) {
    return null;
  }

  const toc = [
    ...(policy.paragraphs?.length
      ? [{ id: "overview", title: "Overview" }]
      : []),
    ...groups.map((group) => ({
      id: slugifySection(group.title),
      title: group.title,
    })),
  ];

  return (
    <EditorialShell>
      <EditorialHero
        current={policy.title}
        eyebrow={`${settings.name} · ${sectionLabel(policy.slug)}`}
        title={policy.title}
        description={policy.intro}
      />
      <BusinessStrip settings={settings} />
      <div className="mt-12 grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <PageToc items={toc} />
        </div>
        <div className="space-y-6">
          {policy.paragraphs?.length ? (
            <section id="overview" className="surface-card scroll-mt-24 space-y-4 p-6 sm:p-8">
              <h2 className="font-display text-2xl tracking-tight">Overview</h2>
              {policy.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ) : null}
          {groups.length ? (
            <div className="space-y-10">
              {groups.map((group) => (
                <section
                  key={group.title}
                  id={slugifySection(group.title)}
                  className="scroll-mt-24"
                >
                  <FaqAccordion groups={[group]} />
                </section>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <EditorialCta
        title="Need help with an order?"
        body="Our team can help with shipping, returns, payments, and the policies on this page."
        primaryHref="/contact-us"
        primaryLabel="Contact us"
        secondaryHref="/track-your-order"
        secondaryLabel="Track your order"
      />
    </EditorialShell>
  );
}
