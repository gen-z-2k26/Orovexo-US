# Multi-store storefront demo

Frontend-only Next.js demo for a self-serve ecommerce product. One App Router codebase serves many differently branded stores. The current store is resolved from the request host (subdomain or custom domain), with a demo switcher for stakeholders.

WordPress and WooCommerce are not wired yet. All data comes from mock JSON behind a thin API layer in `lib/api`. When WooCommerce is ready, swap that adapter only.

## Stack

- Next.js App Router and TypeScript
- Tailwind CSS and shadcn/ui
- Zustand with persist for carts
- Motion for scroll reveals and cart list animation

## Multi-store design

1. `lib/get-current-store-id.ts` resolves the active `storeId` from:
   - demo cookie override when `NEXT_PUBLIC_DEMO_MODE=true`
   - custom domain map
   - subdomain of `NEXT_PUBLIC_ROOT_DOMAIN`
   - fallback `NEXT_PUBLIC_DEFAULT_STORE_ID`
2. `app/layout.tsx` loads store settings, wraps the app in `StoreProvider`, and applies theme CSS variables on `<html>`.
3. Pages fetch products through `lib/api` with the resolved `storeId`.
4. Cart state is persisted per store with localStorage keys like `cart-aurora` and `cart-ember`.

Theme values (primary, accent, font, motion) come from store settings. Components do not hardcode brand colors, names, or logos.

## Run the demo

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful scripts:

```bash
npm run build
npm run start
npm run lint
```

## Switch stores

### Demo switcher

With `NEXT_PUBLIC_DEMO_MODE=true`, the footer shows a store switcher. Choosing a store:

- sets the `demo-store-id` cookie
- refreshes server components
- updates theme, logo, catalog, and homepage sections
- keeps carts isolated per store

### Environment default

Change the default store without the switcher:

```bash
NEXT_PUBLIC_DEFAULT_STORE_ID=ember
```

### Host-based resolution

Examples with `NEXT_PUBLIC_ROOT_DOMAIN=localhost`:

- `aurora.localhost:3000` -> Aurora Living
- `ember.localhost:3000` -> Ember Atelier

Custom domain examples are mapped in `lib/get-current-store-id.ts`:

- `shop.auroraliving.test` -> aurora
- `www.emberatelier.test` -> ember

## Mock stores

| Store id | Brand | Feel |
| --- | --- | --- |
| `aurora` | Aurora Living | Cool blue and teal, Inter, subtle motion, modern home goods |
| `ember` | Ember Atelier | Warm terracotta, Georgia, expressive motion, artisan goods |

Homepage sections are data-driven from each store's `homepage.sections` and rendered through `lib/sections-registry.ts`.

## Shopper flow

1. Browse the homepage sections for the active store
2. Open `/products`, filter by category, sort by price
3. Open a product detail page
4. Add to cart from a card or the detail page
5. Edit quantities in the cart drawer
6. Complete mock checkout (payment step is a placeholder)

## WooCommerce swap

Replace only the implementations inside `lib/api/index.ts`:

- `getStoreSettings(storeId)`
- `getProducts(storeId)`
- `getProduct(storeId, slug)`
- `createOrder(storeId, payload)`

Keep the function signatures and types in `lib/types.ts`. UI code should not need changes for the backend cutover.

## Project map

```
app/                 routes and loading/not-found UI
components/          storefront UI, sections, skeletons
data/                mock stores and products
lib/api/             only place to swap WooCommerce later
lib/                 store context, cart, theme, motion, helpers
public/              local placeholder logos and product images
```

## Notes

- API helpers include a short artificial delay so loading skeletons are visible.
- Motion respects `theme.motion` and `prefers-reduced-motion`.
- Product and hero media use Pexels URLs. `next.config.ts` allows `images.pexels.com` and `videos.pexels.com`.
