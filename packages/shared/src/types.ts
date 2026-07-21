/**
 * Shared domain types for Ledgerly.
 * Kept dependency-free so both the backend engine and the frontend
 * can import the exact same shapes.
 */

export type TransactionCategory =
  | "sales"
  | "ingredients"
  | "bank_and_card_fees"
  | "rent"
  | "utilities"
  | "professional_services"
  | "travel"
  | "equipment"
  | "uncategorised";

export type TransactionSource = "bank_feed" | "statement_upload" | "shopify";

/** A single bank/Shopify transaction, pre- or post-categorisation. */
export interface Transaction {
  id: string;
  date: string; // ISO 8601
  description: string;
  /** Positive = money in, negative = money out, in minor units (pence) */
  amountMinor: number;
  currency: "GBP";
  category: TransactionCategory;
  /** True until a human (or a confident auto-categoriser) has confirmed it */
  needsReview: boolean;
  source: TransactionSource;
}

/** The plain-English VAT breakdown shown in Step 3 of the guided wizard. */
export interface VatFigures {
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  /** HMRC VAT Return Box 1 — VAT due on sales */
  vatOnSalesMinor: number;
  /** HMRC VAT Return Box 4 — VAT reclaimed on purchases */
  vatReclaimedMinor: number;
  /** HMRC VAT Return Box 5 — net VAT owed (or reclaimable, if negative) */
  netVatDueMinor: number;
  /** HMRC VAT Return Box 6 — total value of sales, excluding VAT */
  totalSalesExVatMinor: number;
  /** HMRC VAT Return Box 7 — total value of purchases, excluding VAT */
  totalPurchasesExVatMinor: number;
}

export type FilingType = "vat_return" | "confirmation_statement" | "annual_accounts";

export type FilingStatus = "not_started" | "in_progress" | "ready_to_submit" | "submitted";

export interface Filing {
  id: string;
  type: FilingType;
  status: FilingStatus;
  dueDate: string; // ISO date
  /** Which of the 4 guided-wizard steps has been completed, 0-4 */
  stepsCompleted: number;
  submittedAt?: string;
  hmrcReference?: string;
}

/** Audit trail entry — every filing must be traceable from inputs to outputs. */
export interface FilingAuditEntry {
  filingId: string;
  timestamp: string;
  actor: "system" | "merchant";
  action: string;
  inputSnapshot?: unknown;
  outputSnapshot?: unknown;
}
