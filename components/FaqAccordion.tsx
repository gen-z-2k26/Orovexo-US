import type { FaqGroup } from "@/lib/types";

export function FaqAccordion({ groups }: { groups: FaqGroup[] }) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.title} className="space-y-4">
          <h2 className="font-display text-2xl tracking-tight">{group.title}</h2>
          <div className="space-y-3">
            {group.items.map((item) => (
              <details
                key={item.question}
                className="group surface-card overflow-hidden"
              >
                <summary className="cursor-pointer list-none px-5 py-4 font-medium tracking-tight marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.question}
                    <span
                      className="text-muted-foreground transition-transform group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="border-t border-border px-5 py-4 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
