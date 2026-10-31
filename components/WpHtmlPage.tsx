import { PageHero } from "@/components/PageHero";
import { pageContainer } from "@/lib/layout";

export function WpHtmlPage({
  title,
  html,
}: {
  title: string;
  html: string;
}) {
  return (
    <div className={pageContainer("py-10 sm:py-14")}>
      <PageHero current={title} title={title} />
      <div
        className="prose prose-neutral mt-10 max-w-none text-sm leading-relaxed text-muted-foreground dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
