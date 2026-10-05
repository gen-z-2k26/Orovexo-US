import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { JsonLd } from "@/components/JsonLd";
import { StoreProvider } from "@/lib/store-context";
import { getCurrentStoreId } from "@/lib/get-current-store-id";
import { getStoreSettings, listStores } from "@/lib/api";
import { getThemeStyle } from "@/lib/theme";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const storeId = await getCurrentStoreId();
    const settings = await getStoreSettings(storeId);
    const description = `Shop ${settings.name}. Browse products, add to cart, and checkout in this multi-store ecommerce demo.`;

    return {
      title: {
        default: `${settings.name} | Online store`,
        template: `%s | ${settings.name}`,
      },
      description,
      applicationName: settings.name,
      authors: [{ name: settings.name }],
      creator: settings.name,
      keywords: [
        settings.name,
        "online store",
        "ecommerce",
        "shop",
        "multi-store",
      ],
      openGraph: {
        type: "website",
        siteName: settings.name,
        title: `${settings.name} | Online store`,
        description,
        images: [
          {
            url: settings.logo,
            alt: `${settings.name} logo`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${settings.name} | Online store`,
        description,
        images: [settings.logo],
      },
      robots: {
        index: true,
        follow: true,
      },
      alternates: {
        canonical: "/",
      },
    };
  } catch {
    return {
      title: "Multi-store storefront",
      description: "Frontend demo for a self-serve ecommerce product.",
      robots: {
        index: true,
        follow: true,
      },
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storeId = await getCurrentStoreId();
  const [settings, stores] = await Promise.all([
    getStoreSettings(storeId),
    listStores(),
  ]);

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.name,
    logo: settings.logo,
    url: "/",
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.name,
    url: "/",
    potentialAction: {
      "@type": "SearchAction",
      target: "/products?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html
      lang={settings.locale.startsWith("en") ? "en" : "en"}
      className={`${manrope.variable} h-full antialiased`}
      style={getThemeStyle(settings)}
      data-store={settings.id}
      data-motion={settings.theme.motion}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <JsonLd data={organizationLd} />
        <JsonLd data={websiteLd} />
        <StoreProvider settings={settings}>
          <Header />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer settings={settings} stores={stores} />
          <CartDrawer />
        </StoreProvider>
      </body>
    </html>
  );
}
