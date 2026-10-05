export function categoryToSlug(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function findCategoryBySlug(
  categories: string[],
  slug: string,
): string | null {
  const normalized = slug.toLowerCase();
  return (
    categories.find((category) => categoryToSlug(category) === normalized) ??
    null
  );
}
