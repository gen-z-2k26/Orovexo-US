import Link from "next/link";
import Image from "next/image";
import type { StoreSettings } from "@/lib/types";
import { StoreSwitcher } from "@/components/StoreSwitcher";
import { pageContainer } from "@/lib/layout";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "All products" },
      { href: "/products", label: "On sale" },
      { href: "/products", label: "New arrivals" },
      { href: "/products", label: "Spare parts" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/products", label: "Compatibility finder" },
      { href: "/products", label: "Track your order" },
      { href: "/products", label: "FAQs" },
      { href: "/products", label: "Contact us" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/", label: "About us" },
      { href: "/", label: "Blog" },
      { href: "/", label: "Careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/", label: "Shipping policy" },
      { href: "/", label: "Returns policy" },
      { href: "/", label: "Privacy policy" },
      { href: "/", label: "Terms" },
    ],
  },
];

export function Footer({
  settings,
  stores,
}: {
  settings: StoreSettings;
  stores: Pick<StoreSettings, "id" | "name" | "logo">[];
}) {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className={pageContainer("py-14 sm:py-16")}>
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2fr] lg:gap-16">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Image
                src={settings.logo}
                alt={`${settings.name} logo`}
                width={40}
                height={40}
                className="size-10 rounded-2xl"
              />
              <div className="space-y-0.5">
                <p className="text-lg font-semibold">{settings.name}</p>
                <p className="text-xs text-muted-foreground">Built for pressure</p>
              </div>
            </div>
            <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              Underwater-grade ecommerce UI demo. Each store keeps its own
              branding, catalog, and cart inside one codebase.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>support@{settings.id}.demo</li>
              <li>+1 (786) 887-2550</li>
              <li>Mon-Fri · 09:00-16:00 EST</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 sm:gap-8">
            {columns.map((column) => (
              <div key={column.title} className="space-y-3">
                <p className="text-sm font-semibold">{column.title}</p>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {demoMode ? (
          <div className="mt-12">
            <StoreSwitcher stores={stores} currentStoreId={settings.id} />
          </div>
        ) : null}

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.name}. All rights reserved.
          </p>
          <p>Frontend-only demo. Orders are mocked and never charged.</p>
        </div>
      </div>
    </footer>
  );
}
