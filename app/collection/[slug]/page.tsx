import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductsCatalog } from "@/components/ProductsCatalog";
import { getCurrentStoreId } from "@/lib/get-current-store-id";
import {
  getCategories,
  getProducts,
  getStoreSettings,
} from "@/lib/api";
import { findCategoryBySlug, categoryToSlug } from "@/lib/category";
import { pageContainer } from "@/lib/layout";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const storeId = await getCurrentStoreId();
  const [settings, categories] = await Promise.all([
    getStoreSettings(storeId),
    getCategories(storeId),
  ]);
  const category = findCategoryBySlug(categories, slug);

  if (!category) {
    return {
      title: "Collection not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: category,
    description: `Shop ${category} at ${settings.name}.`,
    alternates: {
      canonical: `/collection/${categoryToSlug(category)}`,
    },
    openGraph: {
      title: `${category} | ${settings.name}`,
      description: `Browse ${category} products from ${settings.name}.`,
    },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const storeId = await getCurrentStoreId();
  const [settings, categories, products] = await Promise.all([
    getStoreSettings(storeId),
    getCategories(storeId),
    getProducts(storeId),
  ]);
  const category = findCategoryBySlug(categories, slug);

  if (!category) {
    notFound();
  }

  const collectionCount = products.filter(
    (product) => product.category === category,
  ).length;

  return (
    <div className={pageContainer("space-y-8 py-10 sm:py-12")}>
      <header className="space-y-3 border-b border-border pb-8">
        <p className="text-sm font-medium text-primary">
          Home / Shop / {category}
        </p>
        <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
          {category}
        </h1>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          {collectionCount} product{collectionCount === 1 ? "" : "s"} in this
          collection at {settings.name}. Use the filters to refine results.
        </p>
      </header>
      <ProductsCatalog
        key={category}
        products={products}
        initialCategory={category}
        syncCategoryUrl
      />
    </div>
  );
}
