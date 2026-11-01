import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerCarePage } from "@/components/CustomerCarePage";
import { PolicyPageView } from "@/components/PolicyPageView";
import { getSiteSettings } from "@/lib/api";
import { customerCareBySlug } from "@/lib/customer-care";
import { layoutForTrustSlug, trustBySlug } from "@/lib/trust";
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
  const care = customerCareBySlug(slug);
  if (care) {
    return { title: care.title, description: care.description };
  }
  const trust = trustBySlug(slug);
  if (trust) {
    return { title: trust.title, description: trust.description };
  }
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
  const settings = await getSiteSettings();
  const care = customerCareBySlug(slug);
  if (care) {
    return <CustomerCarePage page={care} settings={settings} />;
  }
  const trust = trustBySlug(slug);
  if (trust) {
    return (
      <CustomerCarePage
        page={trust}
        settings={settings}
        layout={layoutForTrustSlug(slug)}
      />
    );
  }

  const policy = policyBySlug(slug);
  if (!policy) notFound();

  return (
    <PolicyPageView
      policy={policy}
      groups={groupsForPolicy(policy, settings.pages.faq.groups)}
      settings={settings}
    />
  );
}
