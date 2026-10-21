import type { Metadata } from "next";
import { HomeSections } from "@/components/HomeSections";
import { JsonLd } from "@/components/JsonLd";
import {
  getFeaturedProducts,
  getSiteSettings,
  getSiteUrl,
  getTopCategories,
} from "@/lib/api";

export const revalidate = 60;

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
  const [categories, featuredProducts] = await Promise.all([
    getTopCategories(6),
    getFeaturedProducts(8),
  ]);
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
        settings={settings}
        products={featuredProducts}
        categories={categories}
      />
    </>
  );
}
