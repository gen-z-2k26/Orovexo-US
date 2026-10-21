import type { Category, Product, StoreSettings } from "@/lib/types";
import { HeroSection } from "@/components/sections/HeroSection";
import { TrustStripSection } from "@/components/sections/TrustStripSection";
import { CategoriesSection } from "@/components/sections/CategoriesSection";
import { FeaturedProductsSection } from "@/components/sections/FeaturedProductsSection";
import { StorySection } from "@/components/sections/StorySection";
import { StepsSection } from "@/components/sections/StepsSection";
import { TrustSection } from "@/components/sections/TrustSection";
import { NewsletterSection } from "@/components/sections/NewsletterSection";

/**
 * Homepage layout is owned by Next.js (design system).
 * Product and category cards are filled only from WooCommerce props.
 */
export function HomeSections({
  settings,
  products,
  categories,
}: {
  settings: StoreSettings;
  products: Product[];
  categories: Category[];
}) {
  return (
    <div>
      <HeroSection settings={settings} />
      <TrustStripSection />
      <CategoriesSection settings={settings} categories={categories} />
      <FeaturedProductsSection products={products} />
      <StorySection settings={settings} />
      <StepsSection />
      <TrustSection />
      <NewsletterSection settings={settings} />
    </div>
  );
}
