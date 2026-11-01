import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DiscoverAbout } from "@/components/DiscoverView";
import { getSiteSettings } from "@/lib/api";
import { discoverBySlug } from "@/lib/discover";

export const revalidate = 60;

const PAGE = discoverBySlug("about-us");

export const metadata: Metadata = {
  title: PAGE?.title ?? "About Us",
  description: PAGE?.description,
};

export default async function AboutPage() {
  if (!PAGE) notFound();
  const settings = await getSiteSettings();
  return <DiscoverAbout page={PAGE} settings={settings} />;
}
