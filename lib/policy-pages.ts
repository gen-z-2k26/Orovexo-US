import { CONTENT_PAGES } from "@/lib/site-urls";
import type { FaqGroup } from "@/lib/types";

export type PolicyPageDef = {
  slug: string;
  title: string;
  description: string;
  intro: string;
  groupTitles: string[];
  paragraphs?: string[];
};

export const POLICY_PAGES: PolicyPageDef[] = [
  {
    slug: "shipping-policy",
    title: "Shipping & Delivery",
    description: "Free standard shipping, processing times, and delivery estimates for Orvexo Electronics.",
    intro:
      "Eligible domestic orders receive free standard shipping, with no minimum purchase requirement.",
    groupTitles: ["Shipping and delivery"],
  },
  {
    slug: "return-and-refund-policy",
    title: "Returns & Refunds",
    description: "How to return an eligible product and how refunds are issued.",
    intro:
      "We offer a 30-calendar-day return window for eligible products and a $0 restocking fee on approved returns.",
    groupTitles: ["Returns and exchanges", "Refunds"],
  },
  {
    slug: "cancellation-policy",
    title: "Order Cancellations",
    description: "How to request a cancellation before fulfillment begins.",
    intro:
      "You may request cancellation before fulfillment begins. The cancellation fee is $0.00.",
    groupTitles: ["Placing and managing orders"],
  },
  {
    slug: "payment-policy",
    title: "Payment Options",
    description: "Checkout methods, currency, tax, and payment security at Orvexo Electronics.",
    intro:
      "Prices and checkout payments are displayed in United States Dollars (USD). The methods shown at checkout are the options available for your purchase.",
    groupTitles: ["Payments and checkout"],
  },
  {
    slug: "buy-now-pay-later",
    title: "Buy Now, Pay Later",
    description: "Afterpay, Affirm, and other installment options that may appear at checkout.",
    intro:
      "Afterpay is one of our primary payment options, subject to availability and provider approval.",
    groupTitles: ["Buy Now, Pay Later (BNPL)"],
  },
  {
    slug: "warranty",
    title: "Warranty & Support",
    description: "Manufacturer warranty coverage and what to do if a product has an issue.",
    intro:
      "Warranty availability varies by product and manufacturer. We do not promise a blanket one-year warranty on all products.",
    groupTitles: ["Warranty and product support"],
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    description: "How this shop collects and uses your information.",
    intro:
      "We may use customer information to process orders, provide support, arrange shipping, and maintain the website, as described here and in any WordPress privacy page.",
    groupTitles: ["Accounts, privacy, and security"],
  },
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    description: "Terms that apply when you shop with us.",
    intro:
      "By placing an order you agree to the purchasing, shipping, return, and payment terms published on this site.",
    groupTitles: ["Placing and managing orders", "Payments and checkout"],
  },
  {
    slug: "cookie-policy",
    title: "Cookie Policy",
    description: "How cookies are used on the Orvexo Electronics storefront.",
    intro:
      "Essential cookies may support shopping carts, checkout, security, and other website functions. Additional cookies depend on the services enabled.",
    groupTitles: ["Accounts, privacy, and security"],
  },
  {
    slug: "legal-notice",
    title: "Legal Notice",
    description: "Business identity and correspondence address for Orvexo Electronics.",
    intro:
      "Orvexo Electronics is operated by Universal Lighting Technologies.",
    groupTitles: ["General questions"],
    paragraphs: [
      "Business address: 1430 Wall Triana Hwy SW, Madison, AL 35756, United States. This address is for business correspondence and is not a retail showroom or an authorized return location.",
      "Website: https://orvexo.us. Email: info@orvexo.us. Phone: +1 (256) 772-8820.",
    ],
  },
  {
    slug: "accessibility-statement",
    title: "Accessibility Statement",
    description: "Our aim to keep shopping information easier to navigate and understand.",
    intro:
      "We want our website and shopping information to be easier for customers to navigate and understand.",
    groupTitles: [],
    paragraphs: [
      "If you have trouble using a page, product listing, or checkout step, contact us at info@orvexo.us or +1 (256) 772-8820 and we will help you complete your request.",
      "Live chat is available 24/7. Business hours are Monday-Friday, 9:00 AM-5:00 PM Central Time.",
    ],
  },
  {
    slug: "your-privacy-choices",
    title: "Your Privacy Choices",
    description: "How to ask about personal data used for your Orvexo Electronics orders.",
    intro:
      "You may contact info@orvexo.us with a privacy-related request. Applicable rights depend on relevant privacy laws.",
    groupTitles: ["Accounts, privacy, and security"],
  },
];

export function policyBySlug(slug: string) {
  return POLICY_PAGES.find((page) => page.slug === slug) ?? null;
}

export function groupsForPolicy(policy: PolicyPageDef, groups: FaqGroup[]) {
  if (!policy.groupTitles.length) return [];
  return groups.filter((group) => policy.groupTitles.includes(group.title));
}

export function contentPageTitle(slug: string) {
  return CONTENT_PAGES.find((page) => page.slug === slug)?.title ?? slug;
}
