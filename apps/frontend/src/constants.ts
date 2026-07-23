/**
 * TODO: filings don't yet store their own period boundaries (only a due
 * date — see the Filing model in packages/shared). Until quarter selection
 * is built, every VAT wizard run uses this fixed period.
 */
export const DEMO_PERIOD = {
  start: "2026-04-01",
  end: "2026-09-30",
  label: "Q2 2026",
};
