"use client";

import Image from "next/image";
import Link from "next/link";
import type { SectionComponentProps } from "@/lib/sections-registry";
import { Reveal } from "@/components/sections/Reveal";
import { categoryToSlug } from "@/lib/category";
import { useMotionEnabled } from "@/lib/use-motion-enabled";
import { pageContainer, sectionStackClass, sectionYClass } from "@/lib/layout";
import { cn } from "@/lib/utils";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function CategoriesSection({ props, products }: SectionComponentProps) {
  const eyebrow = asString(props.eyebrow, "The collection");
  const title = asString(props.title, "Categories");
  const subtitle = asString(props.subtitle, "Browse by category.");
  const { enabled } = useMotionEnabled();

  const categories = Array.from(
    products.reduce((map, product) => {
      const current = map.get(product.category);
      if (!current) {
        map.set(product.category, {
          count: 1,
          image: product.images[0] ?? "",
        });
      } else {
        current.count += 1;
      }
      return map;
    }, new Map<string, { count: number; image: string }>()),
  ).sort(([a], [b]) => a.localeCompare(b));

  return (
    <section
      aria-labelledby="categories-heading"
      className={cn("border-b border-border", sectionYClass)}
    >
      <div className={pageContainer(sectionStackClass)}>
        <Reveal className="max-w-2xl space-y-3">
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h2
            id="categories-heading"
            className="text-balance text-3xl font-semibold sm:text-4xl"
          >
            {title}
          </h2>
          <p className="text-pretty text-muted-foreground">{subtitle}</p>
        </Reveal>

        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map(([category, meta], index) => (
            <li key={category} className="h-full">
              <Reveal delay={index * 0.04} className="h-full">
                <Link
                  href={`/collection/${categoryToSlug(category)}`}
                  aria-label={`Shop ${category}, ${meta.count} products`}
                  className={cn(
                    "group relative flex h-full min-h-44 flex-col justify-end overflow-hidden rounded-3xl border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-52",
                    enabled &&
                      "transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-primary/50",
                  )}
                >
                  {meta.image ? (
                    <Image
                      src={meta.image}
                      alt={`${category} category`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-black/55" />
                  <div className="relative z-10 flex flex-col gap-1 p-5 sm:p-6">
                    <span className="text-xs text-white/75 tabular-nums">
                      {meta.count} product{meta.count === 1 ? "" : "s"}
                    </span>
                    <span className="text-xl font-semibold text-balance text-white">
                      {category}
                    </span>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
