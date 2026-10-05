import type { ComponentType } from "react";
import type { HomeSectionType, Product, StoreSettings } from "@/lib/types";
import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturedProductsSection } from "@/components/sections/FeaturedProductsSection";
import { CategoriesSection } from "@/components/sections/CategoriesSection";

export type SectionComponentProps = {
  props: Record<string, unknown>;
  settings: StoreSettings;
  products: Product[];
};

const registry: Record<
  HomeSectionType,
  ComponentType<SectionComponentProps>
> = {
  hero: HeroSection,
  featuredProducts: FeaturedProductsSection,
  categories: CategoriesSection,
};

export function getSectionComponent(type: string) {
  if (type in registry) {
    return registry[type as HomeSectionType];
  }
  return null;
}
