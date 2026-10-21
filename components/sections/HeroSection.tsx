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
    <section className="relative isolate min-h-[78dvh] overflow-hidden border-b border-border">
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
        <Reveal className="max-w-3xl space-y-5">
          <p className="font-display text-2xl font-semibold tracking-tight text-accent sm:text-3xl">
            Jansen
          </p>
          <h1 className="font-display text-balance text-[length:var(--text-5xl)] font-semibold tracking-tight text-white sm:text-[length:var(--text-6xl)]">
            {settings.hero?.headline || "Shop a wide range of products in one place"}
          </h1>
          <p className="max-w-xl text-pretty text-[length:var(--text-lg)] leading-relaxed text-white/88">
            {settings.hero?.support ||
              "From everyday essentials to standout finds, browse many different items and pick what fits you."}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/products"
              className={cn(
                buttonVariants({ size: "lg" }),
                "min-w-40 rounded-2xl",
              )}
            >
              Shop now
            </Link>
            <Link
              href="/#categories"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "min-w-40 rounded-2xl border-white/35 bg-white/10 text-white hover:bg-white/15 hover:text-white",
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
