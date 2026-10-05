"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { SectionComponentProps } from "@/lib/sections-registry";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/sections/Reveal";
import { useMotionEnabled } from "@/lib/use-motion-enabled";
import { easings, motionByLevel } from "@/lib/motion";
import { pageContainer, sectionStackClass, sectionYClass } from "@/lib/layout";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function FeaturedProductsSection({
  props,
  products,
}: SectionComponentProps) {
  const featured = products.slice(0, 4);
  const eyebrow = asString(props.eyebrow, "Moving fastest this month");
  const title = asString(props.title, "Featured products");
  const subtitle = asString(props.subtitle, "A few picks from this store.");
  const { enabled, level } = useMotionEnabled();
  const tokens = motionByLevel[level];

  return (
    <section aria-labelledby="featured-heading" className={sectionYClass}>
      <div className={pageContainer(sectionStackClass)}>
        <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium text-primary">{eyebrow}</p>
            <h2
              id="featured-heading"
              className="text-balance text-3xl font-semibold sm:text-4xl"
            >
              {title}
            </h2>
            <p className="text-pretty text-muted-foreground">{subtitle}</p>
          </div>
          <Link
            href="/products"
            className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            All products →
          </Link>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product, index) =>
            enabled ? (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: tokens.distance }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: Math.min(tokens.duration, 0.2),
                  delay: index * Math.min(tokens.stagger, 0.06),
                  ease: easings.standard,
                }}
              >
                <ProductCard product={product} />
              </motion.div>
            ) : (
              <ProductCard key={product.id} product={product} />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
