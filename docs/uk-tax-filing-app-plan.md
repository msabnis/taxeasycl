# UK Tax & Filing App — Planning Doc

*Living document — last updated: 20 July 2026*

---

## 1. Vision

A financial app for UK sole traders and small businesses that makes tax and statutory filing simple: calculates tax/profit, prepares VAT returns and Companies House documents, and files them automatically — pulling data from a connected bank account or an uploaded statement.

## 2. Target Users

- Sole traders
- Small UK limited companies (owner-managed, low complexity)

## 3. Core Features

- Financial calculations: tax, profit, VAT
- **Preparation** of VAT returns and Companies House documents (not just submission — the app builds the actual filing from underlying transaction data)
- Automatic online filing to HMRC (VAT, and eventually MTD Income Tax) and Companies House (confirmation statements, accounts)
- Bank data via Open Banking integration, or manual statement upload as a fallback/MVP path
- Simple, non-technical interface — hides the underlying compliance complexity

## 4. Regulatory Landscape

### 4.1 HMRC — Making Tax Digital

| | Status |
|---|---|
| MTD for VAT | Mandatory since 2022 for all VAT-registered businesses. Filing via HMRC API only — the old portal is gone. |
| MTD for Income Tax (ITSA) | Mandatory from **April 2026** for self-employed/landlords with qualifying income above £50,000. Threshold expected to drop over following years, pulling in more sole traders. Replaces the single annual return with quarterly digital updates + year-end final declaration. |

Technical requirements:
- Register app on HMRC Developer Hub → sandbox testing → production credentials
- OAuth-based, per-user consent (each end user authorises the app against their own HMRC account)
- **Legally required** to transmit "fraud prevention headers" (device/browser/IP metadata) with every submission — HMRC can fine/block non-compliant software
- "HMRC recognised" = passed technical conformance tests, not an endorsement

### 4.2 Companies House

Two separate strands:

1. **Filing mechanics** — OAuth2-based API (Transactions API, Registered Office Address API, etc.). From **1 April 2027**, WebFiling for accounts is switched off entirely; all companies/LLPs must file accounts through commercial software, tagged in **iXBRL**. This is a forcing function — a lot of self-filers will need third-party software within the next year.
2. **Identity verification / ACSP** — Under ECCTA, directors and PSCs need identity verification. From spring/autumn 2026, **third parties filing on behalf of other companies must be registered as an Authorised Corporate Service Provider (ACSP)**, which requires UK AML supervision.
   - **Open question to resolve with counsel**: does the app filing on behalf of users (as "automatic filing" implies) count as agent-filing (→ ACSP required), or is the user filing their own return using our software as a tool (→ likely not)? This materially affects scope/timeline.

### 4.3 Open Banking (bank connectivity)

Pulling and displaying bank transaction data back to a user = "Account Information Service" under UK payment services regulation. Two paths:
- **Direct FCA authorisation** as an AISP — can take up to ~12 months
- **Agent of an existing licensed provider** (TrueLayer, Plaid, Tink, Yapily, Moneyhub) — typically 4–6 weeks, operates under their FCA licence

**Manual statement upload carries zero regulatory overhead** (no AIS classification triggered) — good MVP path while live bank feeds are added later via an aggregator.

### 4.4 Suggested regulatory sequencing

1. VAT filing via HMRC API (well-documented, no extra licence)
2. Statement upload for bank data (no FCA involvement)
3. Companies House filing, scoped as self-filing tool (not agent) initially
4. Later: live Open Banking feeds via aggregator (agent route), revisit ACSP registration if full "automatic" agent-filing is the long-term goal

## 5. Technical Architecture

### 5.1 Deployment

- **MVP**: Railway, EU-West (Amsterdam) region explicitly selected (default is US — must be set manually). SOC 2 Type II / SOC 3 certified, GDPR DPA available.
- **Scale-up**: AWS, London region (eu-west-2) for UK-specific data residency, VPC isolation, KMS-managed encryption for OAuth tokens and financial documents, proper audit logging.
- **Frontend**: split out to Vercel once the product grows — good fit for the dashboard/marketing site.
- **Note**: Vercel/Netlify are not a substitute for the backend host. Their serverless/edge functions have tight execution-time limits, a poor fit for iXBRL generation, PDF assembly, quarterly-update scheduling, and long-lived OAuth token refresh. Keep the backend "financial engine" as persistent services on Railway/AWS; use Vercel/Netlify for frontend + light API routes only.

### 5.2 Version Control — GitHub

- Private repo
- Branch protection on `main`: required PR review + passing CI before merge (especially important given the calculation/filing logic is the highest-stakes code in the app)
- GitHub Actions for CI (test suite) and deploy triggers into Railway/Vercel/AWS
- Secrets (HMRC client secrets, Companies House credentials, Open Banking keys) live in GitHub Actions secrets / Railway env vars / AWS Secrets Manager — never in the repo
- Secret-scanning enabled (GitHub native, or gitleaks in CI)
- Access control on who can merge changes to tax-calculation logic — useful for audit trail if ACSP/AML supervision becomes relevant later

### 5.3 Architectural principle

Keep the calculation/document-generation engine (VAT calc, iXBRL generation, profit/tax calc) as a **distinct, heavily-tested module**, versioned, with an audit trail of inputs → outputs for every filing. This is both the core IP and the biggest liability surface.

## 6. Open Questions / Decisions Pending

- [ ] App name / branding
- [ ] Whether "automatic filing" requires ACSP registration (get legal opinion)
- [ ] Which Open Banking aggregator to use as agent (TrueLayer vs Plaid vs Tink vs Yapily vs Moneyhub) — cost/coverage comparison needed
- [ ] Pricing model
- [ ] Timeline: MTD ITSA (April 2026) and CH software-only filing (April 2027) are hard external deadlines worth building toward
- [ ] Accounting standard scope (FRS 105 micro-entity first, before FRS 102/full accounts)

---

*Update this doc as decisions get made — treat the "Open Questions" section as the running to-do list.*
