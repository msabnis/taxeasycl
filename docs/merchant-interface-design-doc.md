# Merchant Interface — Design Doc

*Living document — last updated: 20 July 2026*
*Companion to: `merchant-interface-mockup.html` and `uk-tax-filing-app-plan.md`*

---

## 1. Design brief

The interface is for the **sole trader / small business owner** (the "merchant") — someone who is not a bookkeeper and doesn't want to become one. The single job of this interface: turn quarterly tax admin into a short, guided, reassuring routine instead of a source of dread.

Working title used in the mockup: **"Ledgerly"** — a placeholder, not a branding decision. Swap once the app name is chosen (see the main planning doc's open questions).

## 2. Design principles

- **Guided over open-ended.** Anything with a compliance deadline (VAT return, confirmation statement) is a linear, numbered wizard — not a form the merchant has to figure out on their own. Numbering is used only where there's a genuine sequence, which there is here.
- **Plain language over jargon.** "What you owe HMRC," not "Box 5 net VAT liability." The system does the translation; the merchant only ever sees the plain-English version, with the technical figure available if they want to check it.
- **Progress is always visible and resumable.** The dashboard shows exactly how far through a filing the merchant is (progress dots, "1/4 steps done") and guided flows resume where the merchant left off rather than restarting.
- **Completion feels like completion.** Filed and submitted items get a visible, satisfying marker (see Signature element below) rather than just disappearing into a list — this is deliberately the emotional payoff for finishing a tax task.
- **Errors and gaps are opportunities to help, not warnings.** An uncategorised transaction is flagged with "Not sure what this is? Tell us," not a red error banner.

## 3. Design tokens

**Colour**

| Token | Hex | Use |
|---|---|---|
| Ink | `#1C2B3A` | Primary text, headers, nav, dark UI elements |
| Paper | `#EFEFE6` | App background — a cool, muted paper tone (deliberately not the warm cream/terracotta combination common in AI-generated design) |
| Brass | `#C99A3A` | Primary accent — CTAs, active step markers, highlights |
| Ledger green | `#2E5339` | Success / filed / good standing / the stamp motif |
| Stamp red | `#A63D2F` | Deadlines, dues, anything needing attention — used sparingly |
| Slate | `#5B6660` | Secondary text, borders, dividers |

**Type**

| Role | Face | Notes |
|---|---|---|
| Display | Fraunces | Headers, greeting, screen titles — carries warmth and a little editorial character without tipping into "marketing site" |
| Body / UI | IBM Plex Sans | Labels, buttons, body copy — humanist, highly legible, professional without being cold |
| Data / numbers | IBM Plex Mono | All amounts, dates, reference numbers — tabular figures so columns of money actually line up, and it visually signals "this number matters, read it carefully" |

**Signature element — the stamp**

A circular, slightly rotated ink-stamp mark (built in SVG) appears wherever something is officially done: a filed return in the activity list, and — full-size, with a brief stamp-down animation — the moment a VAT return is actually submitted. It's the one deliberately expressive element in an otherwise restrained interface, and it's meant to carry genuine emotional payoff: the physical, satisfying feeling of a rubber stamp landing on a paid invoice, applied to a moment (finishing your VAT return) that normally has no such payoff at all.

## 4. Information architecture

```
Dashboard (home)
├─ Tax position status (hero)
├─ Action cards — one per open filing (VAT return, confirmation statement, ...)
│   └─ each links into its own guided wizard
└─ Recent activity (ledger-style history)

Guided wizard (per filing type — VAT shown in the mockup)
├─ Step 1 — Connect your bank / upload a statement
├─ Step 2 — Review your transactions (auto-categorised, flag anything unclear)
├─ Step 3 — Check the figures (plain-English VAT breakdown)
└─ Step 4 — Submit → confirmation + stamp
```

Each guided wizard is intentionally full-focus: the dashboard's sidebar/nav chrome drops away once a merchant enters a wizard, so there's nothing to get distracted by mid-filing. A single "← Back to dashboard" exit is always available and never discards progress.

## 5. Screen-by-screen notes

**Dashboard**
- Leads with a status hero, not a data table — the first thing a merchant sees is "am I okay?" not a wall of numbers.
- Two action cards is the mockup's example; this should scale to N cards as more filing types (Corporation Tax, MTD ITSA quarterly updates, annual accounts) come online, likely with the soonest deadline surfaced first.
- Activity list uses ledger-style numbered rows deliberately — it's meant to evoke an account book, reinforcing "this is your official record," not just a notifications feed.

**Step 1 — Connect your bank**
- Two large tappable choice cards rather than a form: "Connect your bank account" vs "Upload a statement instead," matching the MVP path from the regulatory doc (statement upload has zero FCA overhead and should always remain available, not just as a fallback for when Open Banking is down).
- "Continue" stays disabled until a choice is made — a small guardrail against merchants accidentally skipping the one step that actually determines the rest of the flow.

**Step 2 — Review transactions**
- Auto-categorised by default; the merchant's job is to glance and correct, not to categorise from scratch.
- Flagged/uncertain items get a distinct visual treatment and an inline, low-friction way to resolve them, rather than blocking progress.

**Step 3 — Check the figures**
- Plain-English labels first, technical VAT box references available as secondary detail for merchants (or their accountants) who want to check the underlying numbers.
- This is the step to be most conservative about visual hierarchy — it's the moment the merchant needs to actually trust a number before authorising a submission.

**Step 4 — Submit**
- One last plain-language summary before the action; submission is deliberately a distinct, slightly weighty action (not a casual "Next") given it's a real HMRC filing.
- The stamp + confirmation view is the reward moment described above, plus the practical next step ("your next return is due in October") so the merchant leaves knowing what happens next, not wondering if it worked.

## 6. Copy & voice

- Active voice, plain verbs: "Submit to HMRC," not "Process submission."
- Name things by what the merchant recognises: "your bank account," "a statement," never internal system terms (no "AISP," "iXBRL," "OAuth" anywhere in the merchant-facing UI — those stay in the engineering doc).
- A button's label and its resulting confirmation match exactly (e.g. "Submit to HMRC" → "HMRC has it"), so the vocabulary itself is the wayfinding.
- No apologetic tone on errors or flags — state plainly what's unclear and offer the fix ("Not sure what this is? Tell us").

## 7. Accessibility & responsiveness

- Visible keyboard focus on all interactive elements (buttons, choice cards).
- Reduced-motion respected — the stamp animation is skipped entirely for `prefers-reduced-motion`, with the stamp simply appearing in its final state.
- Mobile: the wizard's vertical step rail collapses to a compact horizontal strip with numbers only (labels hidden) below ~640px; dashboard action cards stack to a single column.

## 8. Open questions / decisions pending

- [ ] Confirm final app name/branding and restyle the wordmark accordingly
- [ ] Design the confirmation-statement and (eventually) MTD ITSA quarterly-update wizards using this same step pattern — confirm the pattern generalises cleanly before building a fourth or fifth filing type
- [ ] Decide how many action cards the dashboard shows at once once more filing types exist, and how overdue items should be visually distinguished from upcoming ones
- [ ] Mobile-first vs desktop-first: confirm primary device merchants will actually use day-to-day before finalising responsive breakpoints
- [ ] Accountant/bookkeeper view (if the product ever supports an accountant managing multiple merchants) is out of scope for this doc — would likely need a distinct, denser interface

---

*Update this doc alongside the mockup as the design evolves — treat Section 8 as the running to-do list.*
