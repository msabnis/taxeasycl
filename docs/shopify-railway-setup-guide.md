# Shopify ↔ Railway Integration — Setup Guide

*Living document — last updated: 20 July 2026*
*Companion to: `uk-tax-filing-app-plan.md` and `merchant-interface-design-doc.md`*

---

## 1. Why this integration

For merchants who sell through Shopify, pulling orders directly from Shopify gives cleaner, more complete sales data than bank statements alone (bank feeds show the net payout, not the underlying order-by-order VAT breakdown). This sits alongside the existing "Connect your bank / upload a statement" step as a third data source option in the guided VAT wizard.

## 2. Shopify-side setup

### 2.1 App type — this has to be a Public app

As of January 2026, Shopify retired the old "legacy custom app" creation flow from the Shopify Admin — all new apps are created in the Partner Dashboard or Dev Dashboard, and the only two distribution options there are **Public** and **Custom**. Custom apps are still single-store (a merchant creates one for their own shop and hands you a token) — that doesn't scale to a SaaS product connecting many different merchants. We need a **Public app** using OAuth.

- Public apps can be **listed** (appears in Shopify App Store search) or **unlisted** (installed only via a direct link from our own app — no App Store discoverability). We almost certainly want **unlisted**, since merchants will connect via a "Connect your Shopify store" button inside our own dashboard, not by browsing Shopify's marketplace.
- Important nuance: both listed *and* unlisted public apps go through Shopify's app review process before they can be installed on live (non-development) stores. Budget **2–4 weeks** for this review — it's not something we can skip just because we're not listing publicly.
- During development, we can install and test freely on our own Partner development stores without waiting on review.

### 2.2 Registering the app

1. Create/log into a Shopify Partner account at partners.shopify.com.
2. Apps → Create app → Create app manually (skip the Remix template scaffold unless we want it).
3. Choose **Public** distribution.
4. Note the **API key** and **API secret** — these go into Railway as environment variables (never in the repo).
5. Set the **App URL** and **Allowed redirection URL(s)** to point at our Railway-hosted callback endpoint (see §3.3 — worth locking in a stable domain before doing this, so we're not re-registering later).

### 2.3 OAuth flow

Since we're accessing stores we don't own (each merchant's own shop), this is the **Authorization Code Grant** flow: merchant clicks "Connect your Shopify store" in our app → redirected to Shopify's consent screen on their store → Shopify redirects back to our Railway callback with an auth code → we exchange that code server-side for an access token. Tokens issued this way don't expire on their own, so they need to be stored and encrypted with the same level of care as the HMRC/Companies House OAuth tokens already planned (KMS-managed encryption once we're on AWS).

### 2.4 Scopes — request the minimum

- `read_orders` covers the core need (pulling order/sales data for VAT calculations).
- By default, Shopify only grants **60 days of historical order data**. Since we need at least a full VAT quarter (and ideally a year for context), we'll need to separately request the `read_all_orders` scope in the Partner Dashboard — Shopify's review for this can take up to **7 business days**, so request it early rather than when a merchant is mid-onboarding.
- Follow least-privilege: don't request `read_customers`, `write_orders`, etc. unless we actually need them.

### 2.5 Mandatory GDPR compliance webhooks

Any app with access to customer/order data must implement three webhook endpoints — this isn't optional and is one of the most common reasons app review gets rejected if missed:

| Webhook | Trigger | Our obligation |
|---|---|---|
| `customers/data_request` | A customer asks a merchant for their data | Return the relevant data within 30 days |
| `customers/redact` | A customer's data must be deleted | Delete/redact within 30 days (unless we're legally required to retain it, e.g. tax records — worth a legal check on how this interacts with HMRC's 6-year record-keeping requirement) |
| `shop/redact` | Fires ~48 hours after a merchant uninstalls our app | Erase that store's data from our database |

Each webhook must verify the `X-Shopify-Hmac-Sha256` header against our API secret before trusting the payload, and respond with a 200-series status quickly (the actual redaction/data-gathering work can happen asynchronously afterward). These are configured either in `shopify.app.toml` (`compliance_topics`) or in the Partner Dashboard.

## 3. Railway-side setup

### 3.1 Where this lives

The OAuth callback and webhook receivers can live in the same backend service as the HMRC/Companies House engine, or as a dedicated "integrations" service within the same Railway project — either is fine at MVP scale; keep it as a separate module internally either way, consistent with the "financial engine stays cleanly separated" principle from the main plan.

### 3.2 Environment variables

Add to Railway's env vars (never committed to the repo, same pattern as the HMRC/CH credentials):
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SHOPIFY_SCOPES`
- `SHOPIFY_APP_URL` (the Railway/custom domain registered with Shopify)

### 3.3 Stable HTTPS domain

Railway gives every service a `*.up.railway.app` HTTPS domain by default, but since Shopify requires us to register a specific App URL and redirect URLs in the Partner Dashboard, it's worth attaching a **custom domain** (e.g. `api.<ourapp>.com`) via Railway's custom domain feature before registering those URLs with Shopify — avoids having to re-register and wait for review again later if the domain changes.

### 3.4 Raw request body for webhook verification

HMAC verification needs the *exact raw bytes* of the incoming webhook payload — if the web framework's JSON body-parsing middleware runs first and re-serializes it, the signature check will fail. Make sure the raw body is captured before any parsing middleware touches the request.

### 3.5 Fast response, async processing

Shopify expects a quick 200 response and will retry on failure — the webhook handler should just acknowledge receipt and hand the actual work (pulling new orders, recalculating the VAT position) off to a background job/worker, not do it inline. This is the same "persistent service, not a quick function" principle already noted for iXBRL generation and quarterly scheduling — Vercel/Netlify-style short-lived functions are a poor fit here too.

### 3.6 Rate limits

Shopify's Admin API is rate-limited (cost-based for GraphQL). The sync worker needs basic backoff/retry handling, especially during a merchant's first connection when we're pulling a full quarter or year of historical orders at once.

## 4. Suggested build order

1. Build and test against a free Shopify Partner development store — no review needed for this stage.
2. Get the OAuth flow, token storage, and all three mandatory webhooks working end-to-end.
3. Request the `read_all_orders` scope early (7-business-day lead time) rather than waiting until launch.
4. Submit for Shopify's app review only once the above is solid — budget 2–4 weeks before real merchants can connect.

## 5. Open questions / decisions pending

- [ ] Is the default 60-day order window enough for MVP, or do we need `read_all_orders` from day one?
- [ ] Does the `customers/redact` obligation conflict with HMRC's 6-year record-keeping requirement for transactions tied to a filed VAT return? (legal check needed — same flavour of question as the ACSP one in the main plan)
- [ ] Same Railway service as the HMRC/CH engine, or a separate "integrations" service?
- [ ] Any future case for going *listed* in the Shopify App Store (discoverability), or staying unlisted indefinitely?

---

*Update this doc as the integration gets built — treat Section 5 as the running to-do list.*
