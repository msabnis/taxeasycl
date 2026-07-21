import type { Transaction, TransactionCategory, VatFigures } from "@ledgerly/shared";

/**
 * VAT treatment per category, expressed as a rate (0, 5, or 20).
 *
 * IMPORTANT: this is a simplified starting mapping for the engine's
 * architecture, not a substitute for accountancy sign-off. Food categories
 * in particular have genuinely complex VAT rules (e.g. most bakery items
 * are zero-rated, but eat-in/hot food often is not). Treat this table as
 * the single place that mapping is allowed to live, and review it with an
 * accountant before relying on it for a real filing.
 */
const CATEGORY_VAT_RATE: Record<TransactionCategory, number> = {
  sales: 20,
  ingredients: 0, // most basic foodstuffs are zero-rated
  bank_and_card_fees: -1, // exempt — excluded from VAT calc entirely
  rent: -1, // exempt unless the business has opted to tax
  utilities: 20,
  professional_services: 20,
  travel: 20,
  equipment: 20,
  uncategorised: NaN, // must never reach the calculation — see guard below
};

const SALE_CATEGORIES: TransactionCategory[] = ["sales"];

export class UnresolvedTransactionsError extends Error {
  constructor(public readonly count: number) {
    super(
      `${count} transaction(s) in this period still need review before VAT can be calculated.`
    );
    this.name = "UnresolvedTransactionsError";
  }
}

/** VAT-inclusive amount → VAT element, for a given rate (e.g. 20 for standard rate). */
function vatElementFromInclusiveAmount(amountMinor: number, ratePercent: number): number {
  if (ratePercent <= 0) return 0;
  return Math.round((amountMinor * ratePercent) / (100 + ratePercent));
}

/**
 * Computes the plain-English VAT figures shown in Step 3 of the guided
 * wizard, directly from a merchant's transactions for the period.
 *
 * Throws UnresolvedTransactionsError if any transaction still needs review —
 * by design, the wizard should never let a merchant reach "check the
 * figures" with unresolved items silently excluded.
 */
export function computeVatFigures(
  transactions: Transaction[],
  periodStart: string,
  periodEnd: string
): VatFigures {
  const inPeriod = transactions.filter((t) => t.date >= periodStart && t.date <= periodEnd);

  const unresolved = inPeriod.filter((t) => t.needsReview || t.category === "uncategorised");
  if (unresolved.length > 0) {
    throw new UnresolvedTransactionsError(unresolved.length);
  }

  let vatOnSalesMinor = 0;
  let totalSalesExVatMinor = 0;
  let vatReclaimedMinor = 0;
  let totalPurchasesExVatMinor = 0;

  for (const txn of inPeriod) {
    const rate = CATEGORY_VAT_RATE[txn.category];
    const isSale = SALE_CATEGORIES.includes(txn.category) && txn.amountMinor > 0;
    const isExempt = rate === -1;
    const absAmount = Math.abs(txn.amountMinor);

    if (isSale) {
      const vatElement = vatElementFromInclusiveAmount(absAmount, rate);
      vatOnSalesMinor += vatElement;
      totalSalesExVatMinor += absAmount - vatElement;
    } else if (!isExempt && txn.amountMinor < 0) {
      // A purchase/expense — reclaim the VAT element, unless exempt.
      const vatElement = vatElementFromInclusiveAmount(absAmount, Math.max(rate, 0));
      vatReclaimedMinor += vatElement;
      totalPurchasesExVatMinor += absAmount - vatElement;
    } else if (isExempt && txn.amountMinor < 0) {
      // Exempt purchases still count toward Box 7 (ex-VAT purchase value),
      // just with no reclaimable VAT element.
      totalPurchasesExVatMinor += absAmount;
    }
  }

  return {
    periodStart,
    periodEnd,
    vatOnSalesMinor,
    vatReclaimedMinor,
    netVatDueMinor: vatOnSalesMinor - vatReclaimedMinor,
    totalSalesExVatMinor,
    totalPurchasesExVatMinor,
  };
}
