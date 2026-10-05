"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export function SearchBar({
  className,
  placeholder = "Search parts & products",
}: {
  className?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = query.trim();
    const href = next
      ? `/products?q=${encodeURIComponent(next)}`
      : "/products";
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className={cn(
        "flex h-11 min-w-0 items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 text-sm shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <label htmlFor="store-search" className="sr-only">
        Search products
      </label>
      <input
        id="store-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent py-2 text-foreground outline-none placeholder:text-muted-foreground"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        Search
      </button>
    </form>
  );
}
