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
        <ol className="flex flex-wrap items-center justify-center gap-2">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-foreground">{current}</li>
        </ol>
      </nav>

      <header className="mx-auto mt-6 max-w-4xl space-y-3 text-center sm:mt-8 sm:space-y-4">
        {eyebrow ? (
          <p className="text-sm font-medium tracking-wide text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-balance text-3xl leading-tight sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        ) : null}
      </header>
    </>
  );
}
