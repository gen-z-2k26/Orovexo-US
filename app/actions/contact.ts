"use server";

import { headers } from "next/headers";
import { getSiteSettings } from "@/lib/api";
import { sendContactMessage } from "@/lib/contact-mail";

const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_HITS = 5;

function clientKey(headerList: Headers) {
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "local"
  );
}

function allow(key: string) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_HITS) return false;
  current.count += 1;
  return true;
}

export async function submitContactAction(input: {
  name: string;
  email: string;
  phone?: string;
  orderNumber?: string;
  subject: string;
  message: string;
}) {
  const headerList = await headers();
  if (!allow(clientKey(headerList))) {
    throw new Error("Too many messages. Please wait a minute and try again.");
  }

  const name = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone?.trim() || "";
  const orderNumber = input.orderNumber?.trim() || "";
  const subject = input.subject.trim();
  const message = input.message.trim();

  if (!name || !email || !subject || !message) {
    throw new Error("Name, email, subject, and message are required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email.");
  }
  if (message.length > 5000) {
    throw new Error("Message is too long.");
  }

  const settings = await getSiteSettings();
  const inbox = settings.contact.email.trim();
  await sendContactMessage({
    to: inbox,
    name,
    email,
    phone,
    orderNumber,
    subject,
    message,
  });
  return { inbox };
}
