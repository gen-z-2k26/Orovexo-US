"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

function isRemoteSrc(src: string) {
  return /^https?:\/\//i.test(src);
}

/**
 * Catalog and cart media. Remote Woo URLs use a plain img so a missing
 * next.config hostname cannot crash the page. Local assets stay on next/image.
 */
export function StoreImage({
  src,
  alt,
  fallbackSrc,
  className,
  sizes = "100vw",
  priority = false,
}: {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = (!failed && src) || fallbackSrc || "";

  if (!resolved) {
    return <div className={cn("absolute inset-0 bg-muted", className)} aria-hidden />;
  }

  if (isRemoteSrc(resolved)) {
    return (
      // Remote Woo / Hostinger URLs are not always in next.config at boot.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt={alt}
        className={cn("absolute inset-0 h-full w-full object-cover", className)}
        onError={() => {
          if (!failed) setFailed(true);
        }}
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
      onError={() => {
        if (!failed) setFailed(true);
      }}
    />
  );
}
