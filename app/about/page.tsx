import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { buttonVariants } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/api";
import { pageContainer } from "@/lib/layout";
import { cn } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About us",
  description: "Who we are, how we pack orders, and how to reach the shop.",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const page = settings.pages.about;

  return (
    <div className={pageContainer("py-10 sm:py-14")}>
      <PageHero
        current="About"
        eyebrow={`${settings.name} · ${page.eyebrow}`}
        title={page.title}
        description={page.intro}
      />

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-sm">
          <Image
            src={page.image}
            alt={`${settings.name} workspace`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="space-y-5">
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            {page.body}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className={buttonVariants({ size: "lg" })}>
              Browse the catalog
            </Link>
            <Link
              href="/contact"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>

      {page.values.length ? (
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {page.values.map((value) => (
            <div key={value.title} className="surface-card space-y-2 p-6">
              <h2 className="text-lg tracking-tight">{value.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {value.text}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
