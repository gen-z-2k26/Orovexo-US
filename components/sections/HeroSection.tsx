import { IntentLink as Link } from "@/components/IntentLink";
import Image from "next/image";
import type { StoreSettings } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { pageContainer } from "@/lib/layout";
import { cn } from "@/lib/utils";

const HERO_IMAGE = "/brand/hero-banner-hd.jpg";

export function HeroSection({ settings }: { settings: StoreSettings }) {
  return (
    <section className="relative border-b border-border bg-[#061018]">
      <div className="relative aspect-video w-full overflow-hidden lg:aspect-auto lg:h-[calc(100svh-8rem)] lg:min-h-64">
        <Image
          src={HERO_IMAGE}
          alt="Orvexo Electronics. Premium electronics. Top brands, great deals, fast delivery."
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      <div
        className={pageContainer(
          "flex flex-col gap-3 py-4 sm:flex-row",
          "lg:absolute lg:inset-x-0 lg:bottom-30 lg:py-0",
        )}
      >
        <Link
          href="/products"
          className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto sm:min-w-36")}
        >
          Shop now
        </Link>
        <Link
          href="/#categories"
          className={cn(
            buttonVariants({ size: "lg", variant: "outline" }),
            "w-full border-white/35 bg-black/35 text-white hover:bg-black/50 hover:text-white sm:w-auto sm:min-w-36",
          )}
        >
          Browse categories
        </Link>
      </div>
      <h1 className="sr-only">
        {settings.hero?.headline || settings.name}
      </h1>
    </section>
  );
}
