import type { Category, Product, ProductCategoryRef } from "@/lib/types";

type WooImage = { src?: string; alt?: string };
type WooCategory = {
  id?: number;
  name?: string;
  slug?: string;
  description?: string;
  image?: WooImage | null;
  count?: number;
  parent?: number;
};

export type WooProduct = {
  id: number;
  name: string;
  slug: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  on_sale?: boolean;
  featured?: boolean;
  average_rating?: string;
  rating_count?: number;
  menu_order?: number;
  description?: string;
  short_description?: string;
  images?: WooImage[];
  categories?: WooCategory[];
  stock_status?: string;
};

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value: string | number | undefined | null, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function imagesFromHtml(html: string): string[] {
  const urls: string[] = [];
  const pattern = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    const src = match[1]?.trim();
    if (!src) continue;
    urls.push(src.replace(/^http:\/\//i, "https://"));
  }
  return urls;
}

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function mapCategories(
  categories: WooCategory[] | undefined,
): ProductCategoryRef[] {
  return (categories ?? [])
    .filter((entry) => entry.id && entry.name)
    .map((entry) => ({
      id: Number(entry.id),
      name: String(entry.name),
      slug: String(entry.slug || ""),
    }));
}

export function mapWooProduct(product: WooProduct): Product {
  const regularPrice = toNumber(product.regular_price || product.price);
  const saleRaw = product.sale_price ? toNumber(product.sale_price) : null;
  const onSale = Boolean(product.on_sale && saleRaw && saleRaw > 0);
  const price = onSale && saleRaw ? saleRaw : toNumber(product.price || regularPrice);
  const description =
    stripHtml(product.short_description || "") ||
    stripHtml(product.description || "") ||
    product.name;
  const categories = mapCategories(product.categories);
  const gallery = product.images ?? [];
  const gallerySrcs = gallery
    .map((image) => image.src?.replace(/^http:\/\//i, "https://"))
    .filter((src): src is string => Boolean(src));
  const htmlSrcs = [
    ...imagesFromHtml(product.short_description || ""),
    ...imagesFromHtml(product.description || ""),
  ];
  const images = uniqueUrls(gallerySrcs.length > 0 ? gallerySrcs : htmlSrcs);
  const imageAlts =
    gallery.length > 0
      ? gallery.map((image) => image.alt || product.name)
      : images.map(() => product.name);

  return {
    id: String(product.id),
    slug: product.slug,
    name: product.name,
    price,
    regularPrice,
    salePrice: onSale ? saleRaw : null,
    onSale,
    description,
    images,
    imageAlts,
    category: categories[0]?.name || "",
    categories,
    featured: Boolean(product.featured),
    averageRating: toNumber(product.average_rating),
    ratingCount: toNumber(product.rating_count),
    menuOrder: toNumber(product.menu_order),
    inStock: product.stock_status !== "outofstock",
  };
}

export function mapWooCategory(category: WooCategory): Category {
  return {
    id: Number(category.id || 0),
    name: String(category.name || ""),
    slug: String(category.slug || ""),
    description: stripHtml(category.description || ""),
    image: category.image?.src || "",
    imageAlt: category.image?.alt || String(category.name || ""),
    count: toNumber(category.count),
    parent: toNumber(category.parent),
  };
}
