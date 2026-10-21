"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { StoreImage } from "@/components/StoreImage";
import { cn } from "@/lib/utils";

export function ProductImageCarousel({
  images,
  alt,
  fallbackImage,
  className,
  showOnHover = false,
  rounded = "rounded-2xl",
  sizes = "(max-width: 640px) 100vw, 33vw",
  priority = false,
}: {
  images: string[];
  alt: string;
  fallbackImage: string;
  className?: string;
  showOnHover?: boolean;
  rounded?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const slides = images.length ? images : [fallbackImage];
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
        rounded,
        className,
      )}
    >
      <StoreImage
        src={current}
        alt={alt}
        fallbackSrc={fallbackImage}
        priority={priority}
        sizes={sizes}
        className="pointer-events-none transition-transform duration-200 group-hover:scale-[1.02] group-hover/carousel:scale-[1.02]"
      />

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={prev}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label="Previous image"
            className={cn(
              "pointer-events-auto absolute top-1/2 left-2 z-30 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white shadow-sm backdrop-blur-xs transition-all hover:bg-black/85 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
              arrowVisibility,
            )}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={next}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label="Next image"
            className={cn(
              "pointer-events-auto absolute top-1/2 right-2 z-30 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white shadow-sm backdrop-blur-xs transition-all hover:bg-black/85 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
              arrowVisibility,
            )}
          >
            <ChevronRight className="size-4" />
          </button>

          {!showOnHover ? (
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/65 px-2.5 py-1 text-xs font-medium text-white tabular-nums shadow-sm">
              {index + 1} / {slides.length}
            </div>
          ) : (
            <div
              className={cn(
                "pointer-events-none absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/35 px-2 py-1 backdrop-blur-xs",
                arrowVisibility,
              )}
            >
              {slides.map((_, dotIndex) => (
                <span
                  key={dotIndex}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    dotIndex === index ? "w-3.5 bg-white" : "w-1 bg-white/55",
                  )}
                />
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
