import type { Metadata } from "next";
import { HomeSections } from "@/components/HomeSections";
import { JsonLd } from "@/components/JsonLd";
import {
  getProductsByCategory,
  getSiteSettings,
  getSiteUrl,
  getHomeCategories,
} from "@/lib/api";
import { toCardProduct } from "@/lib/catalog-card";
import { defaultPages } from "@/lib/types";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteUrl = getSiteUrl(settings);
  const title =
    settings.seo.title || `${settings.name} | ${settings.tagline}`;
  const description =
    settings.seo.description || `Shop ${settings.name}. ${settings.tagline}`;
  const ogImage = settings.seo.ogImage || settings.logo;

  return {
    title,
    description,
    keywords: settings.seo.keywords,
    alternates: {
      canonical: siteUrl ? `${siteUrl}/` : "/",
    },
    openGraph: {
      title,
      description,
      url: siteUrl ? `${siteUrl}/` : "/",
      images: [{ url: ogImage, alt: settings.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function HomePage() {
  const settings = await getSiteSettings();
  const categories = await getHomeCategories(3);
  const groups = await Promise.all(
    categories.map(async (category) => {
      const products = (await getProductsByCategory(category.slug)).slice(0, 3);
      return {
        category: { ...category, count: products.length },
        products,
      };
    }),
  );
  const featuredProducts = groups.flatMap((group) => group.products);
  const landingCategories = groups.map((group) => group.category);
  const siteUrl = getSiteUrl(settings);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${settings.name} featured products`,
    numberOfItems: featuredProducts.length,
    itemListElement: featuredProducts.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: siteUrl
        ? `${siteUrl}/products/${product.slug}`
        : `/products/${product.slug}`,
      name: product.name,
      image: product.images[0],
    })),
  };

  return (
    <>
      <JsonLd data={itemListLd} />
      <HomeSections
        settings={{ ...settings, pages: defaultPages }}
        products={featuredProducts.map(toCardProduct)}
        categories={landingCategories}
        categoryProducts={groups.map((group) => ({
          ...group,
          products: group.products.map(toCardProduct),
        }))}
      />
    </>
  );
}
