"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductImageCarousel({
  images,
  alt,
  className,
  showOnHover = false,
  rounded = "rounded-2xl",
  sizes = "(max-width: 640px) 100vw, 33vw",
  priority = false,
}: {
  images: string[];
  alt: string;
  className?: string;
  showOnHover?: boolean;
  rounded?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const slides = images.length ? images : ["/stores/aurora-logo.svg"];
  const [index, setIndex] = useState(0);
  const current = slides[index] ?? slides[0];

  function prev(event?: React.MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    setIndex((value) => (value - 1 + slides.length) % slides.length);
  }

  function next(event?: React.MouseEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    setIndex((value) => (value + 1) % slides.length);
  }

  const arrowVisibility = showOnHover
    ? "opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover/carousel:opacity-100 group-focus-within/carousel:opacity-100"
    : "opacity-100";

  return (
    <div
      className={cn(
        "group/carousel relative overflow-hidden bg-muted",
        showOnHover && "pointer-events-none",
        rounded,
        className,
      )}
    >
      <Image
        src={current}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover transition-transform duration-200 group-hover:scale-[1.02] group-hover/carousel:scale-[1.02]"
      />

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous image"
            className={cn(
              "pointer-events-auto absolute top-1/2 left-3 z-20 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-white shadow-sm hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
              arrowVisibility,
            )}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next image"
            className={cn(
              "pointer-events-auto absolute top-1/2 right-3 z-20 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-white shadow-sm hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
              arrowVisibility,
            )}
          >
            <ChevronRight className="size-4" />
          </button>

          <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium text-white tabular-nums shadow-sm">
            {index + 1} / {slides.length}
          </div>
        </>
      ) : null}
    </div>
  );
}
