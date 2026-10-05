import Link from "next/link";
import Image from "next/image";
import type { SectionComponentProps } from "@/lib/sections-registry";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/sections/Reveal";
import { pageContainer } from "@/lib/layout";
import { cn } from "@/lib/utils";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

type Stat = { value: string; label: string };

function asStats(value: unknown): Stat[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const statValue = asString(record.value);
      const label = asString(record.label);
      if (!statValue || !label) return null;
      return { value: statValue, label };
    })
    .filter((entry): entry is Stat => Boolean(entry));
}

export function HeroSection({ props, settings }: SectionComponentProps) {
  const eyebrow = asString(props.eyebrow, "Pro Line");
  const title = asString(props.title, settings.name);
  const subtitle = asString(
    props.subtitle,
    "Discover products curated for this store.",
  );
  const ctaLabel = asString(props.ctaLabel, "Shop products");
  const ctaHref = asString(props.ctaHref, "/products");
  const ctaSecondaryLabel = asString(props.ctaSecondaryLabel, "Browse all");
  const ctaSecondaryHref = asString(props.ctaSecondaryHref, "/products");
  const image = asString(props.image, settings.logo);
  const video = asString(props.video);
  const promo = asString(props.promo, "FREE SHIPPING ON ORDERS $99+");
  const stats = asStats(props.stats);
  const titleLines = title.split("\n");

  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <div className="absolute inset-0">
        {video ? (
          <video
            className="absolute inset-0 size-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={image}
            aria-hidden
          >
            <source src={video} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div
        className={pageContainer(
          "relative flex min-h-[78dvh] flex-col justify-center py-16 sm:py-20 lg:py-24",
        )}
      >
        {promo ? (
          <Reveal>
            <p className="mb-5 inline-flex w-fit rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground">
              {promo}
            </p>
          </Reveal>
        ) : null}

        <Reveal className="max-w-3xl space-y-5">
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h1 className="text-balance text-4xl font-semibold text-white sm:text-6xl lg:text-7xl">
            {titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="max-w-xl text-pretty text-base leading-relaxed text-white/80 sm:text-lg">
            {subtitle}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={ctaHref}
              className={cn(buttonVariants({ size: "lg" }), "min-w-40 rounded-2xl")}
            >
              {ctaLabel}
            </Link>
            <Link
              href={ctaSecondaryHref}
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "min-w-40 rounded-2xl border-white/30 bg-white/10 text-white hover:bg-white/15 hover:text-white",
              )}
            >
              {ctaSecondaryLabel}
            </Link>
          </div>
        </Reveal>

        {stats.length ? (
          <Reveal
            delay={0.08}
            className="mt-12 grid max-w-3xl grid-cols-3 gap-6 border-t border-white/15 pt-8"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-2xl font-semibold text-white tabular-nums sm:text-3xl">
                  {stat.value}
                </p>
                <p className="text-xs text-white/65">{stat.label}</p>
              </div>
            ))}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
