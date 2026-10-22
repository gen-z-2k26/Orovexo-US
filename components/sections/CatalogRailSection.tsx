import type { Category, Product } from "@/lib/types";
import {
  MarqueeRail,
  type MarqueeRailItem,
} from "@/components/MarqueeRail";

function uniqueItems(items: MarqueeRailItem[]) {
  const seen = new Set<string>();
  const out: MarqueeRailItem[] = [];
  for (const item of items) {
    const key = item.label.trim().toUpperCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...item, label: key });
  }
  return out;
}

export function CatalogRailSection({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const items = uniqueItems([
    ...categories
      .filter((category) => category.parent === 0 && category.name)
      .map((category) => ({
        label: category.name,
        href: `/collection/${category.slug}`,
      })),
    ...products
      .filter((product) => product.name)
      .map((product) => ({
        label: product.name,
        href: `/products/${product.slug}`,
      })),
  ]);

  return (
    <MarqueeRail
      items={items}
      label="Store categories and products"
      duration={34}
    />
  );
}
