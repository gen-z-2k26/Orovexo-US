import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DiscoverFaq } from "@/components/DiscoverFaq";
import { DiscoverFaqFrame } from "@/components/DiscoverView";
import { getSiteSettings } from "@/lib/api";
import { discoverBySlug } from "@/lib/discover";

export const revalidate = 60;

const PAGE = discoverBySlug("faqs");

export const metadata: Metadata = {
  title: PAGE?.title ?? "FAQs",
  description: PAGE?.description,
};

export default async function FaqPage() {
  if (!PAGE) notFound();
  const settings = await getSiteSettings();
  return (
    <DiscoverFaqFrame page={PAGE} settings={settings}>
      <DiscoverFaq page={PAGE} />
    </DiscoverFaqFrame>
  );
}
