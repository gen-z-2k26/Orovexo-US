import type { MetadataRoute } from "next";
import {
  getCategoryRecords,
  getProducts,
  getSiteSettings,
  getSiteUrl,
} from "@/lib/api";
import { POLICY_PAGES } from "@/lib/policy-pages";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  const base = getSiteUrl(settings) || "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/about-us`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/faqs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/contact-us`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/our-commitment`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/reviews`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${base}/track-your-order`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/order-help-center`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...POLICY_PAGES.map((page) => ({
      url: `${base}/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
  ];

  try {
    const [products, categories] = await Promise.all([
      getProducts({ perPage: 100 }),
      getCategoryRecords(),
    ]);

    const productRoutes = products.map((product) => ({
      url: `${base}/products/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const categoryRoutes = categories.map((category) => ({
      url: `${base}/collection/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes];
  } catch {
    return staticRoutes;
  }
}
