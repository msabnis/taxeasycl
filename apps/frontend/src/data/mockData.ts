import type { Transaction } from "@ledgerly/shared";

export const merchant = {
  name: "Priya's Bakery",
  initials: "PB",
  contactFirstName: "Priya",
};

export const currentPeriod = {
  label: "Q2 2026",
  start: "2026-04-01",
  end: "2026-09-30",
  dueDate: "7 Aug 2026",
};

export const sampleTransactions: Transaction[] = [
  {
    id: "t1",
    date: "2026-07-04",
    description: "Wholesale Flour Co.",
    amountMinor: -18_640,
    currency: "GBP",
    category: "ingredients",
    needsReview: false,
    source: "bank_feed",
  },
  {
    id: "t2",
    date: "2026-07-06",
    description: "Square Card Fees",
    amountMinor: -2_410,
    currency: "GBP",
    category: "bank_and_card_fees",
    needsReview: false,
    source: "bank_feed",
  },
  {
    id: "t3",
    date: "2026-07-09",
    description: "Office World Ltd",
    amountMinor: -5_800,
    currency: "GBP",
    category: "uncategorised",
    needsReview: true,
    source: "bank_feed",
  },
  {
    id: "t4",
    date: "2026-07-14",
    description: "Thornfield Catering — invoice paid",
    amountMinor: 41_200,
    currency: "GBP",
    category: "sales",
    needsReview: false,
    source: "bank_feed",
  },
];

/** Pre-computed for the mockup's Step 3 display — matches the VAT engine's worked example. */
export const sampleVatFigures = {
  vatOnSales: "£1,860.00",
  vatReclaimed: "£612.40",
  netVatDue: "£1,247.60",
};
