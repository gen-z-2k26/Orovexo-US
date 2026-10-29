import { FaqAccordion } from "@/components/FaqAccordion";
import { PageHero } from "@/components/PageHero";
import { pageContainer } from "@/lib/layout";
import type { PolicyPageDef } from "@/lib/policy-pages";
import type { FaqGroup } from "@/lib/types";

export function PolicyPageView({
  policy,
  groups,
}: {
  policy: PolicyPageDef;
  groups: FaqGroup[];
}) {
  return (
    <div className={pageContainer("py-10 sm:py-14")}>
      <PageHero
        current={policy.title}
        title={policy.title}
        description={policy.intro}
      />
      {policy.paragraphs?.length ? (
        <div className="mt-8 max-w-3xl space-y-4">
          {policy.paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 40)}
              className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base"
            >
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}
      {groups.length ? (
        <div className="mt-10">
          <FaqAccordion groups={groups} />
        </div>
      ) : null}
    </div>
  );
}
