# Ledgerly (working title)

UK tax & filing app for sole traders and small businesses. See the planning
docs for product/regulatory context and design rationale:

- `docs/uk-tax-filing-app-plan.md` — product vision, regulatory landscape, architecture
- `docs/merchant-interface-design-doc.md` — design tokens, IA, screen-by-screen notes
- `docs/shopify-railway-setup-guide.md` — Shopify + Railway integration setup

## Structure (npm workspaces monorepo)

```
apps/
  backend/    Express + TypeScript API — VAT engine, HMRC/Companies House/Shopify routes
  frontend/   Vite + React + TypeScript — the merchant dashboard + guided VAT wizard
packages/
  shared/     Shared TypeScript types (Transaction, VatFigures, Filing, ...)
```

## Getting started

```bash
npm install
cp .env.example apps/backend/.env   # fill in Shopify/HMRC/Companies House credentials as they exist
npm run dev:backend                 # http://localhost:4000
npm run dev:frontend                # http://localhost:5173 (proxies /api to the backend)
```

## What's implemented so far

- **VAT engine** (`apps/backend/src/engine/vat.ts`) — computes the plain-English VAT
  figures shown in the wizard's Step 3, from a list of categorised transactions.
  Refuses to calculate if any transaction still needs review, by design. Has a
  real test suite (`vat.test.ts`) including a worked example matching the
  merchant interface mockup's numbers exactly.
- **Frontend** (`apps/frontend`) — the dashboard and 4-step guided VAT wizard from
  the design doc, built as real React components sharing the same design tokens
  as the original HTML mockup.
- **Shopify OAuth + webhooks** (`apps/backend/src/routes/shopify`) — the
  Authorization Code Grant flow (install → consent → callback → token exchange),
  HMAC verification for both the OAuth callback and webhook payloads, and stub
  handlers for the three mandatory GDPR compliance webhooks
  (`customers/data_request`, `customers/redact`, `shop/redact`).
- **HMRC / Companies House** — route *structure* only (`/hmrc/status`,
  `/companies-house/status`). Real OAuth and submission logic needs actual
  Developer Hub / Companies House credentials before it can be built and tested
  properly — see the TODOs in those files.

## Known gaps / next steps

- **Token storage is in-memory only** (see TODOs in `routes/shopify/oauth.ts`).
  Needs a real database with encryption at rest before this goes anywhere near
  production credentials — matches the KMS-managed encryption plan in the main
  planning doc once we're on AWS.
- **No persistence layer yet** — transactions/filings are mock data on the
  frontend and nothing is written to a database on the backend. Wiring up
  Postgres (Railway's managed Postgres is the natural MVP choice) is the next
  logical piece of scaffolding.
- **No background job/queue** — the Shopify webhook handler notes where async
  processing should be enqueued rather than run inline; there's no actual queue
  (e.g. BullMQ + Redis) wired up yet.
- **Dev-only dependency vulnerabilities**: `npm audit` flags a moderate-severity
  issue in `esbuild`/`vite`'s dev server (arbitrary-origin requests to the local
  dev server only — doesn't affect the production build). A fix is available via
  a Vite major-version upgrade; worth doing deliberately rather than as a
  drive-by `--force` fix.

## CI

`.github/workflows/ci.yml` runs on every PR into `main`: install → build shared
package → typecheck → lint → test → build everything. Pair this with branch
protection on `main` (required PR review + passing CI) once the repo is on
GitHub, per the main planning doc.

## Deploying

- **Backend** → Railway (see `apps/backend/railway.json`). Set the EU-West
  region explicitly and add the env vars from `.env.example` in the Railway
  dashboard (never commit `.env`).
- **Frontend** → can stay on Railway alongside the backend for now, or split
  out to Vercel once the product grows (see the main planning doc's deployment
  section for the reasoning).
