import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DiscoverCommitment } from "@/components/DiscoverView";
import { getSiteSettings } from "@/lib/api";
import { discoverBySlug } from "@/lib/discover";

export const revalidate = 60;

const PAGE = discoverBySlug("our-commitment");

export const metadata: Metadata = {
  title: PAGE?.title ?? "Our Commitment",
  description: PAGE?.description,
};

export default async function CommitmentPage() {
  if (!PAGE) notFound();
  const settings = await getSiteSettings();
  return <DiscoverCommitment page={PAGE} settings={settings} />;
}
