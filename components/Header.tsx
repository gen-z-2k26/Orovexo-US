"use client";

import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PromoBanner } from "@/components/PromoBanner";
import { useCartStore } from "@/lib/cart-store";
import { useStore } from "@/lib/store-context";
import { useMotionEnabled } from "@/lib/use-motion-enabled";
import { BrandLogo } from "@/components/BrandLogo";
import { pageContainer } from "@/lib/layout";
import { cn } from "@/lib/utils";

const fallbackNav = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/reviews", label: "Reviews" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const { settings } = useStore();
  const items = useCartStore((state) => state.cart.items);
  const openCart = useCartStore((state) => state.openCart);
  const badgeBump = useCartStore((state) => state.badgeBump);
  const { enabled } = useMotionEnabled();
  const [bump, setBump] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const navLinks =
    settings.navigation?.header?.length > 0
      ? settings.navigation.header
      : fallbackNav;

  useEffect(() => {
    if (!badgeBump || !enabled) return;
    setBump(true);
    const timer = window.setTimeout(() => setBump(false), 180);
    return () => window.clearTimeout(timer);
  }, [badgeBump, enabled]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl supports-backdrop-filter:bg-background/75">
      <PromoBanner />

      <div className={pageContainer("flex h-16 items-center gap-3 lg:gap-8")}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>

        <Link
          href="/"
          className="inline-flex items-center rounded-xl transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandLogo heightClass="h-7 sm:h-8" />
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-0 text-sm lg:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="rounded-lg px-2.5 py-2 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground xl:px-3"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div
          data-header-chrome
          className="ml-auto flex min-w-0 items-center justify-end gap-2"
        >
          <Suspense
            fallback={
              <div className="size-10 rounded-xl border border-border bg-background" />
            }
          >
            <SearchBar />
          </Suspense>

          <ThemeToggle />

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="relative"
            aria-label={`Open cart${count ? `, ${count} items` : ""}`}
            onClick={openCart}
          >
            <ShoppingBag className="size-4" />
            {count > 0 ? (
              <Badge
                className={cn(
                  "absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary px-0 text-[10px] text-primary-foreground tabular-nums shadow-xs",
                  enabled && "transition-transform duration-150",
                  bump && "scale-125",
                )}
              >
                {count}
              </Badge>
            ) : null}
          </Button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-border bg-card/95 px-4 py-4 backdrop-blur-lg sm:px-6 lg:hidden lg:px-8">
          <nav
            aria-label="Mobile"
            className="flex flex-col gap-1 text-sm"
          >
            {navLinks.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 transition-colors hover:bg-muted"
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
