import Link from "next/link";

export function PageHero({
  eyebrow,
  title,
  description,
  current,
  wide,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  current: string;
  wide?: boolean;
}) {
  return (
    <>
      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground">{current}</li>
        </ol>
      </nav>

      <header className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-x-16">
        <div className="space-y-3">
          {eyebrow ? (
            <p className="text-sm font-medium tracking-wide text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="font-display text-balance text-4xl leading-tight sm:text-5xl">
            {title}
          </h1>
        </div>
        {description ? (
          <p className="max-w-prose text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg lg:pt-8">
            {description}
          </p>
        ) : null}
      </header>
    </>
  );
}
