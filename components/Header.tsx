"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, ShoppingBag, X } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { useCartStore } from "@/lib/cart-store";
import { useStore } from "@/lib/store-context";
import { useMotionEnabled } from "@/lib/use-motion-enabled";
import { pageContainer } from "@/lib/layout";
import { cn } from "@/lib/utils";

const utilityLinks = [
  { href: "/products", label: "Track order" },
  { href: "/products", label: "Change order" },
  { href: "/products", label: "Find your fit" },
  { href: "/products", label: "Service & repair" },
];

export function Header() {
  const { settings } = useStore();
  const items = useCartStore((state) => state.items);
  const openCart = useCartStore((state) => state.openCart);
  const badgeBump = useCartStore((state) => state.badgeBump);
  const { enabled } = useMotionEnabled();
  const [bump, setBump] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!badgeBump || !enabled) return;
    setBump(true);
    const timer = window.setTimeout(() => setBump(false), 180);
    return () => window.clearTimeout(timer);
  }, [badgeBump, enabled]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 supports-backdrop-filter:bg-background/90">
      <div className="hidden border-b border-border/70 bg-muted/50 text-xs text-muted-foreground md:block">
        <div className={pageContainer("flex items-center justify-between gap-4 py-2")}>
          <nav aria-label="Utility" className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {utilityLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="py-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-5">
            <Link
              href="/products"
              className="py-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              FAQs
            </Link>
            <Link
              href="/products"
              className="py-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>

      <div className={pageContainer("flex items-center gap-3 py-3 lg:gap-6")}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-2xl lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>

        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src={settings.logo}
            alt={`${settings.name} logo`}
            width={40}
            height={40}
            className="size-10 rounded-2xl"
            priority
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{settings.name}</p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Built for pressure
            </p>
          </div>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-6 text-sm font-medium lg:flex"
        >
          <Link href="/" className="py-1 hover:text-primary">
            Home
          </Link>
          <Link href="/products" className="py-1 hover:text-primary">
            Shop
          </Link>
          <Link href="/products" className="py-1 hover:text-primary">
            Compatibility
          </Link>
          <Link href="/products" className="py-1 hover:text-primary">
            Support
          </Link>
        </nav>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3 lg:max-w-md">
          <Suspense
            fallback={
              <div className="hidden h-11 flex-1 rounded-2xl border border-border bg-card md:block" />
            }
          >
            <SearchBar className="hidden min-w-0 flex-1 md:flex" />
          </Suspense>

          <Button
            type="button"
            variant="outline"
            className="relative h-11 gap-2 rounded-2xl px-3.5"
            aria-label={`Open cart${count ? `, ${count} items` : ""}`}
            onClick={openCart}
          >
            <ShoppingBag className="size-4" />
            <span className="hidden text-sm sm:inline">Cart</span>
            {count > 0 ? (
              <Badge
                className={cn(
                  "absolute -right-2 -top-2 size-5 justify-center rounded-full px-0 text-[10px] tabular-nums",
                  enabled && "transition-transform duration-150",
                  bump && "scale-110",
                )}
              >
                {count}
              </Badge>
            ) : null}
          </Button>
        </div>
      </div>

      <div className="border-t border-border px-4 py-3 sm:px-6 md:hidden lg:px-8">
        <Suspense fallback={<div className="h-11 rounded-2xl border border-border bg-card" />}>
          <SearchBar />
        </Suspense>
      </div>

      {menuOpen ? (
        <div className="border-t border-border bg-card px-4 py-4 sm:px-6 lg:hidden lg:px-8">
          <nav aria-label="Mobile" className="flex flex-col gap-1 text-sm font-medium">
            {[
              { href: "/", label: "Home" },
              { href: "/products", label: "Shop" },
              { href: "/products", label: "Compatibility" },
              { href: "/products", label: "Support" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
