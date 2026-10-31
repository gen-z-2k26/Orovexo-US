import type { Metadata } from "next";
import ContactPage from "../contact-us/page";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Order Help Center",
  description:
    "Get help with an Orvexo Electronics order, tracking, returns, or payments.",
};

export default function OrderHelpPage() {
  return <ContactPage variant="help" />;
}
