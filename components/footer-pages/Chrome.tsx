"use client";

import { useEffect, useId, useState } from "react";
import { Check, ChevronUp, Link2, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

export type TocItem = { id: string; title: string };

export function PolicyToc({
  items,
  label,
}: {
  items: TocItem[];
  label: string;
}) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const sheetId = useId();
  const current = items.find((item) => item.id === active) ?? items[0];

  useEffect(() => {
    const nodes = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.6] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      <div className="sticky top-14 z-30 -mx-[var(--page-gutter)] border-b border-border bg-background/95 px-[var(--page-gutter)] py-2 backdrop-blur-md sm:top-16 lg:hidden">
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm"
          aria-expanded={open}
          aria-controls={sheetId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>
            <span className="block text-[10px] font-bold tracking-[0.16em] text-foreground uppercase">
              On this page
            </span>
            <span className="line-clamp-1 text-muted-foreground">{current?.title}</span>
          </span>
          <span aria-hidden>{open ? "▴" : "▾"}</span>
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <nav
            id={sheetId}
            aria-label={label}
            className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-2xl border border-border bg-background p-4 pb-8 shadow-lg"
          >
            <p className="mb-2 text-[10px] font-bold tracking-[0.16em] uppercase">
              {label}
            </p>
            {items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={item.id === active ? "true" : undefined}
                className="flex min-h-11 items-center border-l-2 border-transparent px-3 text-sm aria-[current=true]:border-[var(--fp-bar)]"
                onClick={() => setOpen(false)}
              >
                {item.title}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
      <nav
        aria-label={label}
        className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto lg:block"
      >
        <p className="mb-3 text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
          {label}
        </p>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={item.id === active ? "true" : undefined}
            className="block border-l-2 border-transparent py-1.5 pl-3 text-[13px] leading-snug text-muted-foreground aria-[current=true]:border-[var(--fp-bar)] aria-[current=true]:text-foreground"
          >
            {item.title}
          </a>
        ))}
      </nav>
    </>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      className="fixed right-4 bottom-4 z-30 inline-flex min-h-11 items-center gap-1 rounded-full border border-border bg-background px-4 text-sm shadow-sm print:hidden"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ChevronUp className="size-4" aria-hidden />
      Back to top
    </button>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm print:hidden"
    >
      <Printer className="size-4" aria-hidden />
      Print
    </button>
  );
}

export function CopyAnchor({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy link"
      className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
      onClick={async () => {
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
    </button>
  );
}

export function sectionSurface(index: number) {
  return cn(index % 3 === 1 && "bg-muted/40", index % 3 === 2 && "bg-primary/10");
}
