import type { ReactNode } from "react";
import type { PaymentIconSlug } from "@/lib/types";

function Frame({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      title={label}
      className={
        className ||
        "inline-flex h-8 min-w-[2.75rem] items-center justify-center rounded-md border border-border bg-background px-1.5"
      }
    >
      {children}
    </span>
  );
}

export function PaymentBrandIcon({
  slug,
  label,
}: {
  slug: PaymentIconSlug;
  label: string;
}) {
  switch (slug) {
    case "visa":
      return (
        <Frame label={label}>
          <svg viewBox="0 0 48 16" className="h-3.5 w-9" aria-hidden>
            <text
              x="2"
              y="13"
              fontSize="12"
              fontWeight="700"
              fontFamily="Arial, sans-serif"
              fill="#1A1F71"
            >
              VISA
            </text>
          </svg>
        </Frame>
      );
    case "mastercard":
      return (
        <Frame label={label}>
          <svg viewBox="0 0 36 22" className="h-5 w-8" aria-hidden>
            <circle cx="13" cy="11" r="8" fill="#EB001B" />
            <circle cx="23" cy="11" r="8" fill="#F79E1B" />
            <path
              d="M18 5.2a8 8 0 0 1 0 11.6 8 8 0 0 1 0-11.6Z"
              fill="#FF5F00"
            />
          </svg>
        </Frame>
      );
    case "amex":
      return (
        <Frame label={label} className="inline-flex h-8 min-w-[2.75rem] items-center justify-center rounded-md bg-[#2E77BC] px-1.5">
          <svg viewBox="0 0 48 16" className="h-3.5 w-10" aria-hidden>
            <text
              x="1"
              y="12.5"
              fontSize="9"
              fontWeight="700"
              fontFamily="Arial, sans-serif"
              fill="#fff"
            >
              AMEX
            </text>
          </svg>
        </Frame>
      );
    case "unionpay":
      return (
        <Frame label={label}>
          <svg viewBox="0 0 40 16" className="h-3.5 w-9" aria-hidden>
            <rect x="1" y="2" width="10" height="12" rx="1" fill="#D10429" />
            <rect x="11" y="2" width="10" height="12" rx="1" fill="#0166B3" />
            <rect x="21" y="2" width="10" height="12" rx="1" fill="#0B6C3F" />
            <text
              x="2"
              y="11"
              fontSize="5"
              fontWeight="700"
              fill="#fff"
              fontFamily="Arial, sans-serif"
            >
              UP
            </text>
          </svg>
        </Frame>
      );
    case "discover":
      return (
        <Frame label={label}>
          <span className="text-[10px] font-semibold tracking-wide">DISC</span>
        </Frame>
      );
    case "jcb":
      return (
        <Frame label={label}>
          <span className="text-[10px] font-semibold tracking-wide">JCB</span>
        </Frame>
      );
    case "diners":
      return (
        <Frame label={label}>
          <span className="text-[10px] font-semibold tracking-wide">DC</span>
        </Frame>
      );
    case "paypal":
      return (
        <Frame label={label}>
          <span className="text-[10px] font-semibold tracking-wide text-[#003087]">
            PayPal
          </span>
        </Frame>
      );
    case "apple-pay":
      return (
        <Frame label={label}>
          <span className="text-[10px] font-semibold tracking-wide">
            Apple Pay
          </span>
        </Frame>
      );
    case "google-pay":
      return (
        <Frame label={label}>
          <span className="text-[10px] font-semibold tracking-wide">G Pay</span>
        </Frame>
      );
    case "affirm":
      return (
        <Frame label={label}>
          <span className="text-[10px] font-semibold tracking-wide text-[#0A0A0A] dark:text-foreground">
            Affirm
          </span>
        </Frame>
      );
    case "afterpay":
      return (
        <Frame label={label}>
          <span className="text-[10px] font-semibold tracking-wide text-[#B2FCE4] bg-[#000] rounded px-1 py-0.5">
            Afterpay
          </span>
        </Frame>
      );
    case "klarna":
      return (
        <Frame label={label}>
          <span className="text-[10px] font-semibold tracking-wide text-[#FFB3C7]">
            Klarna
          </span>
        </Frame>
      );
    case "link":
      return (
        <Frame label={label}>
          <span className="text-[10px] font-semibold tracking-wide">Link</span>
        </Frame>
      );
    default:
      return null;
  }
}
