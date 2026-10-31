import Link from "next/link";
import Image from "next/image";
import type { StoreSettings } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/sections/Reveal";
import { pageContainer } from "@/lib/layout";
import { cn } from "@/lib/utils";

const HERO_IMAGE =
  "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1600";

export function HeroSection({ settings }: { settings: StoreSettings }) {
  return (
    <section className="relative isolate min-h-[70dvh] overflow-hidden border-b border-border sm:min-h-[78dvh]">
      <div className="absolute inset-0">
        <Image
          src={HERO_IMAGE}
          alt={`${settings.name} - ${settings.tagline}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
      </div>

      <div
        className={pageContainer(
          "relative flex min-h-[78dvh] flex-col justify-center py-16 sm:py-20",
        )}
      >
        <Reveal className="max-w-3xl space-y-4 text-center sm:space-y-5 sm:text-left">
          <p className="text-base tracking-tight text-accent sm:text-xl">
            {settings.name}
          </p>
          <h1 className="font-display text-balance text-3xl tracking-tight text-white sm:text-6xl">
            {settings.hero?.headline || "Shop a wide range of products in one place"}
          </h1>
          <p className="text-pretty text-base leading-relaxed text-white/88 sm:max-w-xl sm:text-lg">
            {settings.hero?.support ||
              "From everyday essentials to standout finds, browse many different items and pick what fits you."}
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
            <Link
              href="/products"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:min-w-40 sm:w-auto")}
            >
              Shop now
            </Link>
            <Link
              href="/#categories"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "w-full border-white/35 bg-white/10 text-white hover:bg-white/15 hover:text-white sm:min-w-40 sm:w-auto",
              )}
            >
              Browse categories
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
