import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { PageSections } from "@/components/PageSections";
import { buttonVariants } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/api";
import { pageContainer } from "@/lib/layout";
import { cn } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Our commitment",
  description:
    "How Orvexo Electronics approaches transparency, shipping, payments, returns, privacy, and customer support.",
};

export default async function CommitmentPage() {
  const settings = await getSiteSettings();
  const page = settings.pages.commitment;

  return (
    <div className={pageContainer("py-10 sm:py-14")}>
      <PageHero
        current="Our commitment"
        eyebrow={`${settings.name} · ${page.eyebrow}`}
        title={page.title}
        description={page.intro}
      />

      <p className="mt-8 max-w-3xl text-pretty text-lg leading-relaxed text-muted-foreground">
        {page.body}
      </p>

      <PageSections sections={page.sections} />

      {page.ctaTitle ? (
        <div className="mt-14 rounded-3xl border border-border bg-muted/40 px-6 py-8 text-center">
          <p className="font-display text-2xl">{page.ctaTitle}</p>
          {page.ctaBody ? (
            <p className="mx-auto mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">
              {page.ctaBody}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/products" className={buttonVariants({ size: "lg" })}>
              Discover Orvexo Electronics
            </Link>
            <Link
              href="/contact-us"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              Share your feedback
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
