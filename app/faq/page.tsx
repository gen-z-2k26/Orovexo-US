import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/FaqAccordion";
import { PageHero } from "@/components/PageHero";
import { buttonVariants } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/api";
import { pageContainer } from "@/lib/layout";
import { cn } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about orders, shipping, returns, and payments.",
};

export default async function FaqPage() {
  const settings = await getSiteSettings();
  const page = settings.pages.faq;

  return (
    <div className={pageContainer("py-10 sm:py-14")}>
      <PageHero
        current="FAQ"
        eyebrow={`${settings.name} · ${page.eyebrow}`}
        title={page.title}
        description={page.intro}
      />

      <div className="mt-10">
        <FaqAccordion groups={page.groups} />
      </div>

      <div className="mt-14 rounded-3xl border border-border bg-muted/40 px-6 py-8 text-center">
        <p className="font-display text-2xl">Still need help?</p>
        <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-muted-foreground">
          Send a message and we will get back during opening hours.
        </p>
        <Link
          href="/contact"
          className={cn(buttonVariants({ size: "lg" }), "mt-5")}
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
