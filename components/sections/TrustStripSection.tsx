import { Reveal } from "@/components/sections/Reveal";
import { getTrustIcon } from "@/lib/icons";
import { pageContainer } from "@/lib/layout";
import type { TrustItem } from "@/lib/types";

const items: TrustItem[] = [
  { icon: "truck", title: "Free shipping", text: "Across the Netherlands" },
  { icon: "refresh", title: "30-day returns", text: "Per return policy" },
  { icon: "shield", title: "Secure checkout", text: "Protected payments" },
  { icon: "message", title: "Help when you need it", text: "Live chat 24/7" },
];

export function TrustStripSection() {
  return (
    <section aria-label="Benefits" className="border-b border-border bg-card/80">
      <div className={pageContainer("py-5 sm:py-6")}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => {
            const Icon = getTrustIcon(item.icon);
            return (
              <Reveal key={item.title} delay={index * 0.05} as="li">
                <div className="flex items-start gap-3">
                  <Icon
                    className="mt-0.5 size-5 shrink-0 text-primary"
                    aria-hidden
                  />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-base font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
