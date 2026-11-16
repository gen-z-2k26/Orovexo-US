import type { Metadata } from "next";
import { pageContainer } from "@/lib/layout";
import { getSiteSettings } from "@/lib/api";
import { PageHero } from "@/components/PageHero";
import { ReviewsBoard } from "@/components/ReviewsBoard";
import { storeReviews } from "@/lib/store-reviews";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Customer reviews",
  description:
    "Featured shopper notes about ordering, packing, and delivery across the store.",
};

export default async function ReviewsPage() {
  const settings = await getSiteSettings();
  const reviews = storeReviews();

  return (
    <div className={pageContainer("py-10 sm:py-14")}>
      <PageHero
        current="Reviews"
        eyebrow={`${settings.name} · Customer reviews`}
        title="What shoppers say"
        description="Featured notes about checkout, packing, and delivery from across the shop. These are not tied to a single product. Filter by star rating or sort by date."
      />

      <div className="mt-10">
        <ReviewsBoard reviews={reviews} locale={settings.locale || "en-US"} />
      </div>
    </div>
  );
}
