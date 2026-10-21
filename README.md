# ElbertJansens storefront

Single-store Next.js storefront for one WooCommerce shop.

- **Design** lives in this Next.js app (components, theme tokens, layout, motion).
- **Catalog and store data** come from WordPress / WooCommerce admin via the REST API (Axios client against `wc/v3`).
- No ACF. No hardcoded products.

## Data flow

| Source | What |
| --- | --- |
| WooCommerce REST (`wc/v3`) | Products, categories, featured flags, prices, stock, orders |
| WooCommerce settings | Currency, store address, from-email |
| WordPress `/wp-json` | Site name and tagline |
| `data/site.json` | Design tokens, nav chrome, fallback contact if Woo is unreachable |

Server components and `lib/api` fetch on the server. Consumer keys never ship to the browser.

## Run locally

```bash
pnpm install
cp .env.example .env.local
# Set WC_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET, NEXT_PUBLIC_SITE_URL
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

In WooCommerce admin, mark products as **Featured** and assign category images so the homepage fills in automatically.

## Environment

| Variable | Purpose |
| --- | --- |
| `WC_URL` | WordPress / WooCommerce site URL |
| `WC_CONSUMER_KEY` | Woo REST consumer key |
| `WC_CONSUMER_SECRET` | Woo REST consumer secret |
| `NEXT_PUBLIC_SITE_URL` | Public storefront origin for SEO |

## Scripts

```bash
pnpm run build
pnpm run start
pnpm run lint
```
