import { SectionHeader } from "@/components/sections/SectionHeader";
import { Reveal } from "@/components/sections/Reveal";
import { pageContainer, sectionStackClass, sectionYClass } from "@/lib/layout";
import { cn } from "@/lib/utils";

const steps = [
  {
    number: "01",
    title: "Discover",
    text: "Browse categories and featured products from the store.",
  },
  {
    number: "02",
    title: "Compare",
    text: "Check specs, stock, and prices straight from WooCommerce.",
  },
  {
    number: "03",
    title: "Order",
    text: "Check out securely. Orders are created in WooCommerce.",
  },
  {
    number: "04",
    title: "Enjoy",
    text: "Receive your purchase. Need help? Get in touch with us.",
  },
];

export function StepsSection() {
  return (
    <section
      aria-labelledby="steps-heading"
      className={cn("border-b border-border", sectionYClass)}
    >
      <div className={pageContainer(sectionStackClass)}>
        <SectionHeader
          eyebrow="How it works"
          title="Discover, compare, order"
          subtitle="A wide catalog stays clear when you shop in simple steps."
          titleId="steps-heading"
        />

        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.06} as="li">
              <div className="surface-card h-full space-y-4 p-6">
                <p className="font-display text-3xl font-semibold text-primary/80">
                  {item.number}
                </p>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
