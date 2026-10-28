import Link from "next/link";
import { ReviewStars } from "@/components/ReviewStars";
import { displaySocialProof } from "@/lib/social-proof";
import type { Product } from "@/lib/types";

export function ProductRatingRow({ product }: { product: Product }) {
  const { rating, count } = displaySocialProof(product.id);
  const averageLabel = rating.toFixed(1);
  const label = `${averageLabel} out of 5 stars, based on ${count} reviews. Read all reviews`;

  return (
    <Link
      href="/reviews"
      className="ppx-rating-row inline-flex flex-wrap items-center gap-2 text-sm text-foreground underline-offset-4 hover:underline"
      aria-label={label}
    >
      <ReviewStars rating={rating} size="sm" />
      <span className="tabular-nums font-medium">{averageLabel}/5</span>
      <span className="text-muted-foreground">
        · {count} reviews
      </span>
    </Link>
  );
}
