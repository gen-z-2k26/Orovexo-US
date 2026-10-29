import type { PageSection } from "@/lib/types";

export function PageSections({ sections }: { sections: PageSection[] }) {
  if (!sections.length) return null;

  return (
    <div className="mt-14 space-y-12">
      {sections.map((section) => (
        <section key={section.title} className="max-w-3xl space-y-4">
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
                <div key={item.title} className="surface-card space-y-2 p-5">
                  <h3 className="text-base tracking-tight">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
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
