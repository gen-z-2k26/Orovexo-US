import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import { JsonLd } from "@/components/JsonLd";
import { getCurrentStoreId } from "@/lib/get-current-store-id";
import { getProduct, getStoreSettings } from "@/lib/api";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const storeId = await getCurrentStoreId();
  const [settings, product] = await Promise.all([
    getStoreSettings(storeId),
    getProduct(storeId, slug),
  ]);

  if (!product) {
    return {
      title: "Product not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: product.name,
    description: product.description,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      type: "website",
      title: `${product.name} | ${settings.name}`,
      description: product.description,
      images: product.images.map((url) => ({
        url,
        alt: product.name,
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
  const storeId = await getCurrentStoreId();
  const [settings, product] = await Promise.all([
    getStoreSettings(storeId),
    getProduct(storeId, slug),
  ]);

  if (!product) {
    notFound();
  }

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
    offers: {
      "@type": "Offer",
      priceCurrency: settings.currency,
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `/products/${product.slug}`,
    },
  };

  return (
    <>
      <JsonLd data={productLd} />
      <ProductDetail product={product} />
    </>
  );
}
