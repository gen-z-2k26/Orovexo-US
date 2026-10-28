import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import { JsonLd } from "@/components/JsonLd";
import { getProduct, getProductPaymentDisplay, getSiteSettings, getSiteUrl } from "@/lib/api";
import { getBnplPublicConfig } from "@/lib/bnpl";

export const revalidate = 60;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [settings, product] = await Promise.all([
    getSiteSettings(),
    getProduct(slug),
  ]);

  if (!product) {
    return {
      title: "Product niet gevonden",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const siteUrl = getSiteUrl(settings);
  const url = siteUrl
    ? `${siteUrl}/products/${product.slug}`
    : `/products/${product.slug}`;

  return {
    title: product.name,
    description: product.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      title: `${product.name} | ${settings.name}`,
      description: product.description,
      url,
      images: product.images.map((imageUrl, index) => ({
        url: imageUrl,
        alt: product.imageAlts[index] || product.name,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${settings.name}`,
      description: product.description,
      images: product.images,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [settings, product] = await Promise.all([
    getSiteSettings(),
    getProduct(slug),
  ]);

  if (!product) {
    notFound();
  }

  const siteUrl = getSiteUrl(settings);
  const url = siteUrl
    ? `${siteUrl}/products/${product.slug}`
    : `/products/${product.slug}`;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.id,
    category: product.category,
    brand: {
      "@type": "Brand",
      name: settings.name,
    },
    ...(product.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.averageRating,
            reviewCount: product.ratingCount,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: settings.currency,
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url,
      seller: {
        "@type": "Organization",
        name: settings.name,
      },
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl || "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: siteUrl ? `${siteUrl}/products` : "/products",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: url,
      },
    ],
  };

  return (
    <>
      <JsonLd data={productLd} />
      <JsonLd data={breadcrumbLd} />
      <ProductDetail
        product={product}
        payment={await getProductPaymentDisplay(settings)}
        bnpl={getBnplPublicConfig()}
      />
    </>
  );
}
