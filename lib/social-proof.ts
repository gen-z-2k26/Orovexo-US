/** Stable per-product display rating/count for the PDP social-proof row. */

export function displaySocialProof(productId: string) {
  const hash = hashString(productId);
  const rating = 4.7 + (hash % 3) * 0.1;
  const count = 101 + (hash % 99);
  return {
    rating: Number(rating.toFixed(1)),
    count,
  };
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
