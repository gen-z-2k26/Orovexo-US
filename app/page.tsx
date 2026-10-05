import { HomeSections } from "@/components/HomeSections";
import { JsonLd } from "@/components/JsonLd";
import { getCurrentStoreId } from "@/lib/get-current-store-id";
import { getProducts, getStoreSettings } from "@/lib/api";

export default async function HomePage() {
  const storeId = await getCurrentStoreId();
  const [settings, products] = await Promise.all([
    getStoreSettings(storeId),
    getProducts(storeId),
  ]);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${settings.name} featured products`,
    itemListElement: products.slice(0, 8).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `/products/${product.slug}`,
      name: product.name,
      image: product.images[0],
    })),
  };

  return (
    <>
      <JsonLd data={itemListLd} />
      <h1 className="sr-only">{settings.name} online store</h1>
      <HomeSections settings={settings} products={products} />
    </>
  );
}
