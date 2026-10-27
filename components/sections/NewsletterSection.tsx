"use client";

import type { FormEvent } from "react";
import type { StoreSettings } from "@/lib/types";
import { Reveal } from "@/components/sections/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageContainer, sectionYClass } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast-store";

export function NewsletterSection({ settings }: { settings: StoreSettings }) {
  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className={cn("border-b border-border", sectionYClass)}
    >
      <div className={pageContainer()}>
        <Reveal className="mx-auto max-w-2xl space-y-6 text-center">
          <div className="space-y-3">
            <h2
              id="newsletter-heading"
              className="font-display text-balance text-3xl sm:text-4xl"
            >
              Stay in the loop
            </h2>
            <p className="text-pretty text-muted-foreground">
              Get updates on new arrivals and offers from {settings.name}.
            </p>
          </div>
          <form
            className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
            action={`mailto:${settings.contact.email}`}
            method="get"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              const form = event.currentTarget;
              const email = new FormData(form).get("body");
              if (typeof email === "string" && email.trim()) {
                toast({
                  title: "Opening your email app",
                  description: "Finish sending to subscribe.",
                });
              }
            }}
          >
            <Input
              type="email"
              name="body"
              required
              placeholder="Your email address"
              className="h-12"
              aria-label="Email address for newsletter"
            />
            <Button type="submit" size="lg" className="sm:px-6">
              Subscribe
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            You can unsubscribe anytime via {settings.contact.email}.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
