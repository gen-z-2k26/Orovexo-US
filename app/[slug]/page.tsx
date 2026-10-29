import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyPageView } from "@/components/PolicyPageView";
import { WpHtmlPage } from "@/components/WpHtmlPage";
import { getSiteSettings } from "@/lib/api";
import { getWpPage } from "@/lib/api/wp-pages";
import {
  groupsForPolicy,
  POLICY_PAGES,
  policyBySlug,
} from "@/lib/policy-pages";

export const revalidate = 60;

export function generateStaticParams() {
  return POLICY_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = policyBySlug(slug);
  if (!policy) return {};
  return { title: policy.title, description: policy.description };
}

export default async function PolicySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = policyBySlug(slug);
  if (!policy) notFound();

  const wp = await getWpPage(slug);
  if (wp?.content) {
    return <WpHtmlPage title={wp.title || policy.title} html={wp.content} />;
  }

  const settings = await getSiteSettings();
  return (
    <PolicyPageView
      policy={policy}
      groups={groupsForPolicy(policy, settings.pages.faq.groups)}
    />
  );
}
