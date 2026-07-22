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
cp .env.example apps/backend/.env   # fill in DATABASE_URL + Shopify/HMRC/Companies House credentials as they exist

# Local Postgres — adjust to however you run Postgres locally; the
# DATABASE_URL in .env.example matches a plain local install:
#   createuser ledgerly --pwprompt --createdb
#   createdb ledgerly --owner=ledgerly

npm run db:migrate --workspace apps/backend   # apply the schema
npm run db:seed --workspace apps/backend      # creates the "Priya's Bakery" example merchant

npm run dev:backend                 # http://localhost:4000
npm run dev:frontend                # http://localhost:5173 (proxies /api to the backend)
```

## What's implemented so far

- **VAT engine** (`apps/backend/src/engine/vat.ts`) — computes the plain-English VAT
  figures shown in the wizard's Step 3, from a list of categorised transactions.
  Refuses to calculate if any transaction still needs review, by design. Has a
  real test suite (`vat.test.ts`) including a worked example matching the
  merchant interface mockup's numbers exactly.
- **Database** (`apps/backend/src/db`) — Drizzle ORM over Postgres. Five tables
  (`merchants`, `transactions`, `filings`, `filing_audit_entries`,
  `shopify_connections`) mirroring the shared TypeScript types, with a real
  migration in `drizzle/`. Filing status changes are recorded to
  `filing_audit_entries` in the same call that updates them, so every filing
  stays traceable from inputs to outputs. A seed script populates an example
  merchant so there's real data to develop against.
  **Note:** this uses Drizzle rather than Prisma — Prisma's migration engine
  needs to download a binary from `binaries.prisma.sh`, which wasn't reachable
  in the sandbox this was built in. Drizzle is pure TypeScript over the `pg`
  driver and needs nothing beyond npm packages.
- **Frontend** (`apps/frontend`) — the dashboard and 4-step guided VAT wizard from
  the design doc, built as real React components sharing the same design tokens
  as the original HTML mockup.
- **Shopify OAuth + webhooks** (`apps/backend/src/routes/shopify`) — the
  Authorization Code Grant flow (install → consent → callback → token exchange),
  now persisting the access token to `shopify_connections` rather than an
  in-memory map. HMAC verification for both the OAuth callback and webhook
  payloads. The `shop/redact` GDPR webhook actually deletes the persisted
  connection; `customers/data_request` and `customers/redact` are stubs since
  Ledgerly doesn't store Shopify customer PII yet.
- **`GET /api/merchants/:id/vat-figures`** — the first route connecting the
  database to the calculation engine end-to-end: pulls a merchant's real
  transactions for a period from Postgres and runs them through the VAT engine,
  returning a 409 with a clear error if any transaction still needs review.
- **HMRC / Companies House** — route *structure* only (`/hmrc/status`,
  `/companies-house/status`). Real OAuth and submission logic needs actual
  Developer Hub / Companies House credentials before it can be built and tested
  properly — see the TODOs in those files.

## Known gaps / next steps

- **Shopify access tokens are stored as plaintext** in `shopify_connections`.
  Needs encryption at rest (KMS) before this holds any real merchant's
  credentials — matches the plan in the main planning doc once we're on AWS.
- **No auth/session layer yet** — the `merchant_id` query param on
  `/shopify/install` stands in for "the merchant currently logged into
  Ledgerly" until real authentication exists.
- **No background job/queue** — the Shopify webhook handler notes where async
  processing should be enqueued rather than run inline; there's no actual queue
  (e.g. BullMQ + Redis) wired up yet.
- **Frontend still uses mock data** (`apps/frontend/src/data/mockData.ts`) —
  it isn't calling the new `/api/merchants/:id/vat-figures` route yet. Wiring
  that up, plus a proper login flow, is the natural next slice.
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

- **Backend** → Railway (see `apps/backend/railway.json`). Attach a Postgres
  plugin (Railway injects `DATABASE_URL` automatically) and run
  `npm run db:migrate --workspace apps/backend` as a release step. Set the
  EU-West region explicitly and add the remaining env vars from
  `.env.example` in the Railway dashboard (never commit `.env`).
- **Frontend** → can stay on Railway alongside the backend for now, or split
  out to Vercel once the product grows (see the main planning doc's deployment
  section for the reasoning).
