"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { useMotionEnabled } from "@/lib/use-motion-enabled";
import { easings, motionByLevel } from "@/lib/motion";
import { pageContainer, sectionStackClass, sectionYClass } from "@/lib/layout";

export function FeaturedProductsSection({
  products,
}: {
  products: Product[];
}) {
  const featured = products;
  const { enabled, level } = useMotionEnabled();
  const tokens = motionByLevel[level];

  return (
    <section
      id="featured"
      aria-labelledby="featured-heading"
      className={sectionYClass}
    >
      <div className={pageContainer(sectionStackClass)}>
        <SectionHeader
          eyebrow="Featured"
          title="Featured products"
          subtitle="Products marked as featured in WooCommerce."
          titleId="featured-heading"
          action={
            <Link
              href="/products"
              className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              All products →
            </Link>
          }
        />

        {featured.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border px-6 py-14 text-center">
            <p className="font-medium">No products yet</p>
            <p className="mt-2 text-pretty text-sm text-muted-foreground">
              Mark products as featured in WooCommerce, or publish products in
              the catalog.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product, index) =>
              enabled ? (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: tokens.distance }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: Math.min(tokens.duration, 0.35),
                    delay: index * Math.min(tokens.stagger, 0.08),
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
        )}
      </div>
    </section>
  );
}
