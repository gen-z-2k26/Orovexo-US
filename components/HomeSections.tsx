import type { Product, StoreSettings } from "@/lib/types";
import { getSectionComponent } from "@/lib/sections-registry";

export function HomeSections({
  settings,
  products,
}: {
  settings: StoreSettings;
  products: Product[];
}) {
  return (
    <div>
      {settings.homepage.sections.map((section, index) => {
        if (!section.enabled) return null;
        const Component = getSectionComponent(section.type);
        if (!Component) return null;

        return (
          <Component
            key={`${section.type}-${index}`}
            props={section.props}
            settings={settings}
            products={products}
          />
        );
      })}
    </div>
  );
}
