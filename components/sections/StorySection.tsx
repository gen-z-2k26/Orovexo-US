import Link from "next/link";
import type { StoreSettings } from "@/lib/types";
import { Reveal, RevealImage } from "@/components/sections/Reveal";
import { StoreImage } from "@/components/StoreImage";
import { buttonVariants } from "@/components/ui/button";
import { pageContainer, sectionYClass } from "@/lib/layout";
import { cn } from "@/lib/utils";

export function StorySection({
  settings,
  image,
  imageAlt,
}: {
  settings: StoreSettings;
  image?: string;
  imageAlt?: string;
}) {
  return (
    <section
      aria-labelledby="story-heading"
      className={cn("border-y border-border bg-muted/30", sectionYClass)}
    >
      <div
        className={pageContainer(
          "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
        )}
      >
        <Reveal className="space-y-5">
          <p className="text-sm font-medium tracking-wide text-primary">
            About {settings.name}
          </p>
          <h2
            id="story-heading"
            className="font-display text-balance text-3xl sm:text-4xl"
          >
            Built for a clear shopping flow
          </h2>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            Browse, compare, and check out with a total you can review before
            you pay. Catalog data comes from the store; the rest of the site is
            here to explain packing, shipping, and support.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className={cn(buttonVariants({ size: "lg" }), "mt-2 inline-flex")}
            >
              Browse the catalog
            </Link>
            <Link
              href="/about-us"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "mt-2 inline-flex",
              )}
            >
              Read more
            </Link>
          </div>
        </Reveal>

        <RevealImage className="relative aspect-[var(--media-story)] overflow-hidden rounded-2xl border border-border shadow-md">
          <StoreImage
            src={image || settings.logo}
            alt={imageAlt || `${settings.name} product`}
            fallbackSrc={settings.logo}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </RevealImage>
      </div>
    </section>
  );
}
