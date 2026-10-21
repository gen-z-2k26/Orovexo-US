"use client";

import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function canUseViewTransition(): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return false;
  }
  if (!("startViewTransition" in document)) return false;
  if (document.documentElement.dataset.motion === "none") return false;
  if (document.documentElement.dataset.themeTransition) return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SearchBar({
  className,
  placeholder = "Search products...",
}: {
  className?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [expanded, setExpanded] = useState(Boolean(initialQ));
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const morphTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const urlQuery = searchParams.get("q") ?? "";
    setQuery(urlQuery);
    if (urlQuery) {
      setExpanded(true);
    }
  }, [searchParams]);

  const runViewTransition = useCallback(
    (update: () => void, after?: () => void) => {
      if (!canUseViewTransition()) {
        update();
        after?.();
        return;
      }

      const root = document.documentElement;
      root.dataset.searchTransition = "expand";
      if (morphTargetRef.current) {
        morphTargetRef.current.style.viewTransitionName = "header-search";
      }

      try {
        const transition = document.startViewTransition(() => {
          flushSync(() => {
            update();
          });
          if (morphTargetRef.current) {
            morphTargetRef.current.style.viewTransitionName = "header-search";
          }
        });

        after?.();

        transition.finished.finally(() => {
          delete root.dataset.searchTransition;
          if (morphTargetRef.current) {
            morphTargetRef.current.style.viewTransitionName = "";
          }
        });
      } catch {
        delete root.dataset.searchTransition;
        if (morphTargetRef.current) {
          morphTargetRef.current.style.viewTransitionName = "";
        }
        update();
        after?.();
      }
    },
    [],
  );

  const openSearch = useCallback(() => {
    runViewTransition(
      () => {
        setExpanded(true);
      },
      () => {
        window.requestAnimationFrame(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        });
      },
    );
  }, [runViewTransition]);

  const closeSearch = useCallback(() => {
    runViewTransition(() => {
      setExpanded(false);
    });
  }, [runViewTransition]);

  useEffect(() => {
    if (!expanded) return;

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (
        target.closest("[data-header-chrome]") ||
        target.closest("[data-theme-toggle]")
      ) {
        return;
      }

      if (containerRef.current && !containerRef.current.contains(target)) {
        if (!query.trim()) {
          closeSearch();
        }
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSearch();
      }
    }

    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [expanded, query, closeSearch]);

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

  function handleClearOrClose() {
    if (query) {
      setQuery("");
      inputRef.current?.focus();
      if (searchParams.get("q")) {
        startTransition(() => {
          router.push("/products");
        });
      }
      return;
    }
    closeSearch();
  }

  return (
    <div
      ref={containerRef}
      className={cn("flex items-center justify-end", className)}
    >
      {!expanded ? (
        <Button
          ref={(node) => {
            morphTargetRef.current = node;
          }}
          type="button"
          variant="outline"
          size="icon"
          onClick={openSearch}
          aria-label="Open product search"
          aria-expanded={false}
          className="size-10 rounded-2xl"
        >
          <Search className="size-4" />
        </Button>
      ) : (
        <form
          ref={(node) => {
            morphTargetRef.current = node;
          }}
          role="search"
          onSubmit={submit}
          className="flex h-10 w-[min(17.5rem,calc(100vw-9rem))] items-center gap-2 rounded-2xl border border-primary/50 bg-card px-3 text-sm shadow-sm ring-2 ring-primary/15 sm:w-72 md:w-80 lg:w-96 dark:border-input dark:bg-input/30"
        >
          {pending ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
          ) : (
            <Search className="size-4 shrink-0 text-primary" aria-hidden />
          )}
          <label htmlFor="store-search" className="sr-only">
            Search products
          </label>
          <input
            ref={inputRef}
            id="store-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            autoComplete="off"
          />
          {query.trim() ? (
            <button
              type="submit"
              disabled={pending}
              aria-label="Submit search"
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              <ArrowRight className="size-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleClearOrClose}
            aria-label={query ? "Clear search" : "Close search"}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}
