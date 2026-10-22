"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { ProductGrid } from "@/components/ProductGrid";
import { SelectField } from "@/components/SelectField";
import { categoryToSlug } from "@/lib/category";

type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";
type AvailabilityOption = "all" | "in-stock" | "out-of-stock";

export function ProductsCatalog({
  products,
  initialQuery = "",
  initialCategory = "all",
  syncCategoryUrl = false,
}: {
  products: Product[];
  initialQuery?: string;
  initialCategory?: string;
  syncCategoryUrl?: boolean;
}) {
  const router = useRouter();
  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.category)
            .filter((name) => name.trim().length > 0),
        ),
      ).sort(),
    [products],
  );
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState<SortOption>("featured");
  const [availability, setAvailability] =
    useState<AvailabilityOption>("all");
  const query = initialQuery.trim().toLowerCase();

  const visible = useMemo(() => {
    const searched = query
      ? products.filter((product) => {
          const haystack = [
            product.name,
            product.description,
            product.category,
            product.slug,
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(query);
        })
      : products;

    const byCategory =
      category === "all"
        ? searched
        : searched.filter((product) => product.category === category);

    const byAvailability =
      availability === "all"
        ? byCategory
        : availability === "in-stock"
          ? byCategory.filter((product) => product.inStock)
          : byCategory.filter((product) => !product.inStock);

    if (sort === "price-asc") {
      return [...byAvailability].sort((a, b) => a.price - b.price);
    }
    if (sort === "price-desc") {
      return [...byAvailability].sort((a, b) => b.price - a.price);
    }
    if (sort === "name-asc") {
      return [...byAvailability].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...byAvailability].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.menuOrder - b.menuOrder;
    });
  }, [products, category, sort, query, availability]);

  function handleCategoryChange(value: string) {
    setCategory(value);
    if (!syncCategoryUrl) return;
    if (value === "all") {
      router.push("/products");
      return;
    }
    router.push(`/collection/${categoryToSlug(value)}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            id="category-filter"
            label="Category"
            value={category}
            onChange={handleCategoryChange}
            options={[
              { value: "all", label: "All categories" },
              ...categories.map((entry) => ({ value: entry, label: entry })),
            ]}
          />
          <SelectField
            id="availability-filter"
            label="Availability"
            value={availability}
            onChange={(value) => setAvailability(value as AvailabilityOption)}
            options={[
              { value: "all", label: "All products" },
              { value: "in-stock", label: "In stock" },
              { value: "out-of-stock", label: "Out of stock" },
            ]}
          />
          <SelectField
            id="sort-filter"
            label="Sort by"
            value={sort}
            onChange={(value) => setSort(value as SortOption)}
            options={[
              { value: "featured", label: "Featured" },
              { value: "price-asc", label: "Price: low to high" },
              { value: "price-desc", label: "Price: high to low" },
              { value: "name-asc", label: "Name: A to Z" },
            ]}
          />
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="tabular-nums">
            Showing {visible.length} of {products.length} product
            {products.length === 1 ? "" : "s"}
          </p>
          {query ? <p>Search: "{initialQuery.trim()}"</p> : null}
        </div>
      </div>

      <ProductGrid products={visible} />
    </div>
  );
}
