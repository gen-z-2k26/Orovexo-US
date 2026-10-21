"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { pageContainer } from "@/lib/layout";

function userFacingMessage(error: Error) {
  const raw = error.message || "";
  if (/hostname|next\/image|unconfigured-host|Invalid src/i.test(raw)) {
    return "A product image could not be shown. You can keep shopping.";
  }
  if (/woocommerce|store server|unreachable|ECONNABORTED|timeout/i.test(raw)) {
    return "The catalog is taking too long to load. Try again in a moment.";
  }
  return "Something went wrong on this page. Try again, or go back home.";
}

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message = userFacingMessage(error);

  return (
    <div
      className={pageContainer(
        "flex min-h-[60dvh] flex-col items-center justify-center gap-5 py-16 text-center",
      )}
    >
      <p className="text-sm font-medium text-primary">Something went wrong</p>
      <h1 className="font-display text-balance text-3xl font-semibold sm:text-4xl">
        Please try again
      </h1>
      <p className="max-w-md text-pretty text-muted-foreground">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <Button type="button" className="rounded-2xl" onClick={reset}>
          Try again
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Go home
        </Button>
      </div>
    </div>
  );
}
