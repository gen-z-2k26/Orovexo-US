import type { Metadata } from "next";
import { ProductsCatalog } from "@/components/ProductsCatalog";
import { getProducts, getSiteSettings, getSiteUrl } from "@/lib/api";
import { pageContainer } from "@/lib/layout";

export const revalidate = 60;

type ProductsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const [{ q }, settings] = await Promise.all([
    searchParams,
    getSiteSettings(),
  ]);
  const query = q?.trim();
  const siteUrl = getSiteUrl(settings);
  const path = query
    ? `/products?q=${encodeURIComponent(query)}`
    : "/products";

  return {
    title: query ? `Search: ${query}` : "Shop",
    description: query
      ? `Search results for ${query} at ${settings.name}.`
      : `Browse the ${settings.name} catalog. Filter by category and sort by price.`,
    robots: query
      ? { index: false, follow: true }
      : { index: true, follow: true },
    alternates: {
      canonical: siteUrl ? `${siteUrl}${path.split("?")[0]}` : "/products",
    },
    openGraph: {
      title: query ? `${query} | ${settings.name}` : `Shop | ${settings.name}`,
      description: `Browse products from ${settings.name}.`,
    },
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const [{ q }, settings, products] = await Promise.all([
    searchParams,
    getSiteSettings(),
    getProducts(),
  ]);

  return (
    <div className={pageContainer("space-y-8 py-10 sm:py-12")}>
      <header className="space-y-3 border-b border-border pb-8">
        <p className="text-sm font-medium text-primary">
          {settings.name} · Shop
        </p>
        <h1 className="font-display text-balance text-4xl font-semibold sm:text-5xl">
          All products
        </h1>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          Search the catalog, filter by category, and sort by price.
        </p>
      </header>
      <ProductsCatalog products={products} initialQuery={q ?? ""} />
    </div>
  );
}
