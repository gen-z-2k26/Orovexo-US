import Link from "next/link";

export function PageHero({
  eyebrow,
  title,
  description,
  current,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  current: string;
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

      <header className="mt-6 max-w-2xl space-y-3">
        {eyebrow ? (
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-balance text-4xl sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="text-pretty text-muted-foreground">{description}</p>
        ) : null}
      </header>
    </>
  );
}
