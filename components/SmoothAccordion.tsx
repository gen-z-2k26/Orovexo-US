"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMotionEnabled } from "@/lib/use-motion-enabled";

export type AccordionItem = {
  id?: string;
  title: string;
  content: ReactNode;
  defaultOpen?: boolean;
};

export function SmoothAccordion({
  items,
  className,
}: {
  items: AccordionItem[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <AccordionRow key={item.id ?? item.title} item={item} />
      ))}
    </div>
  );
}

function AccordionRow({ item }: { item: AccordionItem }) {
  const [open, setOpen] = useState(Boolean(item.defaultOpen));
  const { enabled } = useMotionEnabled();
  const panelId = useId();
  const buttonId = useId();

  return (
    <div
      className={cn(
        "surface-card overflow-hidden",
        enabled &&
          "transition-[border-color,background-color,box-shadow] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        open && "border-primary/35 bg-muted/25 shadow-sm",
      )}
    >
      <h3 className="m-0">
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span>{item.title}</span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-5 shrink-0 text-muted-foreground",
              enabled &&
                "transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              open && "rotate-180",
            )}
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          "grid",
          enabled &&
            "transition-[grid-template-rows] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-border px-5 py-4 text-pretty text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground sm:text-[0.95rem]">
            {item.content}
          </div>
        </div>
      </div>
    </div>
  );
}
