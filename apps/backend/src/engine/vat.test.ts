import { describe, expect, it } from "vitest";
import type { Transaction } from "@ledgerly/shared";
import { computeVatFigures, UnresolvedTransactionsError } from "./vat";

function txn(overrides: Partial<Transaction>): Transaction {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    date: "2026-07-10",
    description: "test transaction",
    amountMinor: 0,
    currency: "GBP",
    category: "sales",
    needsReview: false,
    source: "bank_feed",
    ...overrides,
  };
}

describe("computeVatFigures", () => {
  it("matches the worked example from the merchant mockup", () => {
    // Priya's Bakery, Q2 2026: £1,860.00 VAT on sales, £612.40 reclaimed,
    // £1,247.60 owed — the figures shown in the Step 3 mockup screen.
    const transactions: Transaction[] = [
      txn({ category: "sales", amountMinor: 1_116_000, date: "2026-07-01" }), // VAT-inclusive sales
      txn({ category: "professional_services", amountMinor: -367_440, date: "2026-07-02" }),
    ];

    const figures = computeVatFigures(transactions, "2026-04-01", "2026-09-30");

    expect(figures.vatOnSalesMinor).toBe(186_000); // £1,860.00
    expect(figures.vatReclaimedMinor).toBe(61_240); // £612.40
    expect(figures.netVatDueMinor).toBe(124_760); // £1,247.60
  });

  it("excludes transactions outside the requested period", () => {
    const transactions: Transaction[] = [
      txn({ category: "sales", amountMinor: 120_000, date: "2026-01-15" }), // out of period
      txn({ category: "sales", amountMinor: 120_000, date: "2026-07-15" }), // in period
    ];

    const figures = computeVatFigures(transactions, "2026-04-01", "2026-09-30");

    expect(figures.vatOnSalesMinor).toBe(20_000); // only the in-period sale
  });

  it("treats zero-rated ingredient purchases as reclaiming no VAT", () => {
    const transactions: Transaction[] = [
      txn({ category: "ingredients", amountMinor: -100_000, date: "2026-07-05" }),
    ];

    const figures = computeVatFigures(transactions, "2026-04-01", "2026-09-30");

    expect(figures.vatReclaimedMinor).toBe(0);
    expect(figures.totalPurchasesExVatMinor).toBe(100_000);
  });

  it("throws if any transaction in the period still needs review", () => {
    const transactions: Transaction[] = [
      txn({ category: "uncategorised", amountMinor: -5_800, date: "2026-07-09", needsReview: true }),
    ];

    expect(() => computeVatFigures(transactions, "2026-04-01", "2026-09-30")).toThrow(
      UnresolvedTransactionsError
    );
  });
});
