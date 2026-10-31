import type { Metadata } from "next";
import {
  BusinessStrip,
  EditorialCta,
  EditorialHero,
  EditorialShell,
  PageToc,
  slugifySection,
} from "@/components/EditorialPage";
import { PageSections } from "@/components/PageSections";
import { getSiteSettings } from "@/lib/api";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Our commitment",
  description:
    "How Orvexo Electronics approaches transparency, shipping, payments, returns, privacy, and customer support.",
};

export default async function CommitmentPage() {
  const settings = await getSiteSettings();
  const page = settings.pages.commitment;
  const toc = page.sections.map((section) => ({
    id: slugifySection(section.title),
    title: section.title.replace(/^\d+\.\s*/, ""),
  }));

  return (
    <EditorialShell>
      <EditorialHero
        current="Our commitment"
        eyebrow={`${settings.name} · ${page.eyebrow}`}
        title={page.title}
        description={page.intro}
      />

      <p className="mt-8 text-pretty text-lg leading-relaxed text-muted-foreground">
        {page.body}
      </p>

      <BusinessStrip settings={settings} />

      <div className="mt-14 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <PageToc items={toc} />
        </div>
        <PageSections className="mt-0" sections={page.sections} />
      </div>

      {page.ctaTitle ? (
        <EditorialCta
          title={page.ctaTitle}
          body={page.ctaBody}
          primaryHref="/products"
          primaryLabel="Discover Orvexo Electronics"
          secondaryHref="/contact-us"
          secondaryLabel="Share your feedback"
        />
      ) : null}
    </EditorialShell>
  );
}
