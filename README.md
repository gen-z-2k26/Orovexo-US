# Ecom Builder storefront

Next.js storefront for one WooCommerce shop. Products, cart, shipping, tax, and coupons come from WooCommerce. Stripe charges the Woo order total. You do not create products in Stripe.

## Local

```bash
cp env.example .env.local
pnpm install
pnpm dev
```

Fill `.env.local`:

- `WC_URL`, `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET` from Woo REST API
- `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test keys: `sk_test_` / `pk_test_`)
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

Leave `SKIP_STRIPE_PAYMENT=no` so checkout uses Stripe. `yes` is local-only and skips the card charge; Woo still creates the order.

## Checkout flow

1. Catalog and cart use Woo REST and Store API.
2. Checkout creates a pending Woo order, then a Stripe PaymentIntent for that total.
3. The shopper pays with Stripe Payment Element.
4. The app (or the webhook) marks the Woo order paid with `set_paid` and the PaymentIntent id.

Do not install WooPayments or the official Stripe plugin for this path.

## Webhook (deployed site)

Local Stripe CLI is optional. For Vercel, add a **Test mode** webhook:

- URL: `https://YOUR-PROJECT.vercel.app/api/stripe/webhook`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`
- Set `STRIPE_WEBHOOK_SECRET` on Vercel to the endpoint `whsec_...`
- Set `NEXT_PUBLIC_SITE_URL` to the same Vercel origin

Redeploy after changing env vars. Test with card `4242 4242 4242 4242`.

## Vercel env

Same Woo and Stripe test keys as local. Do not set `SKIP_STRIPE_PAYMENT` on Vercel.
