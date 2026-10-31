import { slugifySection } from "@/components/EditorialPage";
import type { PageSection } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PageSections({
  sections,
  className,
}: {
  sections: PageSection[];
  className?: string;
}) {
  if (!sections.length) return null;

  return (
    <div className={cn("mt-14 space-y-6", className)}>
      {sections.map((section) => (
        <section
          key={section.title}
          id={slugifySection(section.title)}
          className="surface-card scroll-mt-24 space-y-4 p-6 sm:p-8"
        >
          <h2 className="font-display text-2xl tracking-tight">{section.title}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p
              key={paragraph.slice(0, 48)}
              className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base"
            >
              {paragraph}
            </p>
          ))}
          {section.bullets?.length ? (
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
          {section.items?.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {section.items.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border bg-muted/30 p-5"
                >
                  <h3 className="text-base tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
