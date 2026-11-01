"use client";

import { useMemo, useState } from "react";
import { BlockView, RichText } from "@/components/CustomerCarePage";
import type { CarePage, CareSection } from "@/lib/customer-care";

function sectionText(section: CareSection) {
  return section.blocks
    .map((block) => {
      if (block.type === "faq") return `${block.question} ${block.answer}`;
      if (block.type === "paragraph") return block.text;
      if (block.type === "heading") return block.text;
      if (block.type === "bullets") return block.items.join(" ");
      if (block.type === "numbered") return block.items.join(" ");
      if (block.type === "table") {
        return `${block.headers.join(" ")} ${block.rows.map((row) => `${row.label} ${row.value}`).join(" ")}`;
      }
      if (block.type === "contact") {
        return block.fields.map((field) => `${field.label} ${field.value}`).join(" ");
      }
      return "";
    })
    .join(" ")
    .toLowerCase();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function DiscoverFaq({ page }: { page: CarePage }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState(page.sections[0]?.id ?? "all");
  const [openAll, setOpenAll] = useState<boolean | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return page.sections
      .filter((section) => topic === "all" || section.id === topic)
      .map((section) => {
        if (!q) return section;
        const faqs = section.blocks.filter(
          (block) =>
            block.type !== "faq" ||
            block.question.toLowerCase().includes(q) ||
            block.answer.toLowerCase().includes(q),
        );
        if (!sectionText(section).includes(q) && !faqs.some((block) => block.type === "faq")) {
          return null;
        }
        return { ...section, blocks: faqs };
      })
      .filter((section): section is CareSection => Boolean(section));
  }, [page.sections, query, topic]);

  return (
    <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <label className="mb-4 block text-sm">
          <span className="sr-only">Search questions</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search questions"
            className="sticky top-16 z-20 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </label>
        <div className="mb-6 flex gap-2 overflow-x-auto lg:flex-col">
          {page.sections.map((section) => {
            const count = section.blocks.filter((block) => block.type === "faq").length;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setTopic(section.id)}
                className={`min-h-11 shrink-0 rounded-full border px-3 text-left text-xs lg:rounded-xl ${topic === section.id ? "border-foreground bg-foreground text-background" : "border-border"}`}
              >
                {section.title.replace(/^\d+\.\s+/, "")} ({count})
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <button
          type="button"
          className="mb-4 min-h-11 text-sm underline"
          onClick={() => setOpenAll((value) => (value === true ? false : true))}
        >
          {openAll === true ? "Collapse all" : "Expand all"}
        </button>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No matching questions found. Try a different search, or email{" "}
            <RichText text="info@orvexo.us" />.
          </p>
        ) : (
          <div className="space-y-12">
            {filtered.map((section) => {
              const faqs = section.blocks.filter((block) => block.type === "faq");
              const other = section.blocks.filter((block) => block.type !== "faq");
              const sourceIndex = page.sections.findIndex((item) => item.id === section.id);
              return (
                <section key={section.id} id={section.id} className="scroll-mt-32">
                  <h2 className="font-display mb-5 flex gap-4 text-[28px] font-normal">
                    <span className="tabular-nums">{String(sourceIndex + 1).padStart(2, "0")}</span>
                    {section.title}
                  </h2>
                  {other.map((block, blockIndex) => (
                    <BlockView key={blockIndex} block={block} contactStyle="grid" />
                  ))}
                  {faqs.map((block) => {
                    if (block.type !== "faq") return null;
                    const id = slugify(block.question);
                    const match = query && block.question.toLowerCase().includes(query.toLowerCase());
                    return (
                      <details
                        key={block.question}
                        id={id}
                        open={Boolean(query) || (openAll === null ? sourceIndex === 0 : openAll)}
                        className="border-b border-border"
                      >
                        <summary className="flex min-h-11 cursor-pointer list-none items-center py-3 text-base">
                          <span className={match ? "bg-primary/30" : undefined}>{block.question}</span>
                        </summary>
                        <p
                          className="max-w-[68ch] pb-4 text-[16px] leading-[1.7] text-muted-foreground"
                          ref={(node) => node?.setAttribute("hidden", "until-found")}
                        >
                          <RichText text={block.answer} />
                        </p>
                      </details>
                    );
                  })}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
