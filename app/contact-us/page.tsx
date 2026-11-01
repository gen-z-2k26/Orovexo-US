import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DiscoverContact } from "@/components/DiscoverView";
import { getSiteSettings } from "@/lib/api";
import { discoverBySlug } from "@/lib/discover";

export const revalidate = 60;

const PAGE = discoverBySlug("contact-us");

export const metadata: Metadata = {
  title: PAGE?.title ?? "Contact Us",
  description: PAGE?.description,
};

export default async function ContactPage() {
  if (!PAGE) notFound();
  const settings = await getSiteSettings();
  return <DiscoverContact page={PAGE} settings={settings} />;
}
