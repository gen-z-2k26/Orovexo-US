import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { PageSections } from "@/components/PageSections";
import { StoreImage } from "@/components/StoreImage";
import { buttonVariants } from "@/components/ui/button";
import { getFeaturedProducts, getSiteSettings } from "@/lib/api";
import { pageContainer } from "@/lib/layout";
import { cn } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About us",
  description:
    "Orvexo Electronics is a US-focused online electronics store operated by Universal Lighting Technologies.",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const page = settings.pages.about;
  const products = await getFeaturedProducts(8);
  const product = products.find((item) => item.images[0]);

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
          <StoreImage
            src={product?.images[0] || settings.logo}
            alt={product?.imageAlts[0] || product?.name || settings.name}
            fallbackSrc={settings.logo}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div className="space-y-5">
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            {page.body}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className={buttonVariants({ size: "lg" })}>
              Shop Orvexo Electronics
            </Link>
            <Link
              href="/contact-us"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              Contact our team
            </Link>
          </div>
        </div>
      </div>

      {page.values.length ? (
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      <PageSections sections={page.sections || []} />

      {page.ctaTitle ? (
        <div className="mt-14 rounded-3xl border border-border bg-muted/40 px-6 py-8 text-center">
          <p className="font-display text-2xl">{page.ctaTitle}</p>
          {page.ctaBody ? (
            <p className="mx-auto mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">
              {page.ctaBody}
            </p>
          ) : null}
          <Link
            href="/products"
            className={cn(buttonVariants({ size: "lg" }), "mt-5")}
          >
            Shop Orvexo Electronics
          </Link>
        </div>
      ) : null}
    </div>
  );
}
