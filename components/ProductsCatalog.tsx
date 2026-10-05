"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { ProductGrid } from "@/components/ProductGrid";
import { SelectField } from "@/components/SelectField";

type SortOption = "featured" | "price-asc" | "price-desc";

export function ProductsCatalog({
  products,
  initialQuery = "",
}: {
  products: Product[];
  initialQuery?: string;
}) {
  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortOption>("featured");
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

    const filtered =
      category === "all"
        ? searched
        : searched.filter((product) => product.category === category);

    if (sort === "price-asc") {
      return [...filtered].sort((a, b) => a.price - b.price);
    }
    if (sort === "price-desc") {
      return [...filtered].sort((a, b) => b.price - a.price);
    }
    return filtered;
  }, [products, category, sort, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div className="grid flex-1 gap-4 sm:grid-cols-2 sm:gap-5">
          <SelectField
            id="category-filter"
            label="Category"
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: "All categories" },
              ...categories.map((entry) => ({ value: entry, label: entry })),
            ]}
          />
          <SelectField
            id="sort-filter"
            label="Sort by price"
            value={sort}
            onChange={(value) => setSort(value as SortOption)}
            options={[
              { value: "featured", label: "Featured" },
              { value: "price-asc", label: "Price: low to high" },
              { value: "price-desc", label: "Price: high to low" },
            ]}
          />
        </div>
        <div className="space-y-1 text-sm text-muted-foreground sm:text-right">
          <p className="tabular-nums">
            {visible.length} product{visible.length === 1 ? "" : "s"}
          </p>
          {query ? <p>Search: "{initialQuery.trim()}"</p> : null}
        </div>
      </div>

      <ProductGrid products={visible} />
    </div>
  );
}
