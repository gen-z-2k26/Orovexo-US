import Image from "next/image";
import Link from "next/link";
import type { StoreSettings } from "@/lib/types";
import { Reveal, RevealImage } from "@/components/sections/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { pageContainer, sectionYClass } from "@/lib/layout";
import { cn } from "@/lib/utils";

const STORY_IMAGE =
  "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200";

export function StorySection({ settings }: { settings: StoreSettings }) {
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
            About this demo
          </p>
          <h2
            id="story-heading"
            className="font-display text-balance text-[length:var(--text-3xl)] font-semibold sm:text-[length:var(--text-4xl)]"
          >
            Built to show the storefront flow
          </h2>
          <p className="text-pretty text-[length:var(--text-lg)] leading-relaxed text-muted-foreground">
            Sample pages for browsing, filtering, and checkout. Product data
            comes from WooCommerce when the API is connected; everything else
            here is placeholder demo copy.
          </p>
          <Link
            href="/products"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-2 inline-flex rounded-2xl",
            )}
          >
            Browse the catalog
          </Link>
        </Reveal>

        <RevealImage className="relative aspect-[var(--media-story)] overflow-hidden rounded-[calc(var(--radius)*2)] border border-border shadow-[var(--shadow-md)]">
          <Image
            src={STORY_IMAGE}
            alt={`${settings.name} workspace`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </RevealImage>
      </div>
    </section>
  );
}
