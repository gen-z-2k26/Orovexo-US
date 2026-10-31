import { SmoothAccordion } from "@/components/SmoothAccordion";
import type { FaqGroup } from "@/lib/types";

export function FaqAccordion({ groups }: { groups: FaqGroup[] }) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.title} className="space-y-4">
          <h2 className="font-display text-2xl tracking-tight">{group.title}</h2>
          <SmoothAccordion
            items={group.items.map((item) => ({
              title: item.question,
              content: item.answer,
            }))}
          />
        </section>
      ))}
    </div>
  );
}
