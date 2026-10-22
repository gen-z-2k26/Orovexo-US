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

Server components and `lib/api` fetch on the server. Consumer keys and the Stripe secret key never ship to the browser.

Checkout is headless: this app creates a pending Woo order, collects the card with Stripe Payment Element, then verifies the PaymentIntent on the Next.js server and marks the Woo order paid (`set_paid` + `transaction_id`). Do not install the WooCommerce Stripe plugin or WooPayments for this flow.

## Run locally

```bash
pnpm install
cp .env.example .env.local
# Set WC_*, NEXT_PUBLIC_SITE_URL, and Stripe keys
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

In WooCommerce admin, mark products as **Featured** and assign category images so the homepage fills in automatically.

## Environment

| Variable | Purpose |
| --- | --- |
| `WC_URL` | WordPress / WooCommerce site URL |
| `WC_CONSUMER_KEY` | Woo REST consumer key (Read/Write) |
| `WC_CONSUMER_SECRET` | Woo REST consumer secret |
| `NEXT_PUBLIC_SITE_URL` | Public storefront origin for SEO |
| `STRIPE_SECRET_KEY` | Stripe secret key (server only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (browser) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for `POST /api/stripe/webhook` |

Point Stripe webhooks at `{NEXT_PUBLIC_SITE_URL}/api/stripe/webhook` for `payment_intent.succeeded`.

## WooCommerce admin (cart and payments)

This storefront does **not** use the Woo cart page. The drawer cart is local. Woo still owns catalog, stock, tax, and the order record.

Required:

- **Settings > Advanced > REST API**: keys with Read/Write. Permalinks not Plain. SSL on `WC_URL`.
- **Settings > General**: store address, currency matching the Stripe account, selling locations.
- **Settings > Products > Inventory**: stock management if you want stock reduced when the order is marked paid. Set **Hold stock** so pending unpaid orders expire.
- **Products**: purchasable, priced, in stock. Line items use Woo product IDs.

Payments:

- Do **not** enable the official Stripe / WooPayments gateway. This app writes `payment_method: stripe` on the order itself.
- Optional: disable Cash on delivery on the WordPress checkout so guests cannot place unpaid COD orders there.
- After a test card payment, **WooCommerce > Orders** should show **Processing**, transaction ID `pi_...`, and a paid date.

Cart-related Woo settings that still apply: inventory, hold stock, taxes. Abandoned-cart plugins will not see the Next.js cart.

Recommended: **Settings > Tax**, **Settings > Shipping** (v1 does not send shipping lines), **Settings > Emails** for processing-order mail, guest checkout (`customer_id` 0).

## Scripts

```bash
pnpm run build
pnpm run start
pnpm run lint
```
