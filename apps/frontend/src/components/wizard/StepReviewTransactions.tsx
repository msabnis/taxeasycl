import { useState } from "react";
import type { Transaction, TransactionCategory } from "@ledgerly/shared";
import { ApiError, categoriseTransaction } from "../../api/client";
import { formatMinorAsGBP } from "../../utils/currency";

interface StepReviewTransactionsProps {
  transactions: Transaction[];
  onTransactionUpdated: (updated: Transaction) => void;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  sales: "Sales",
  ingredients: "Ingredients",
  bank_and_card_fees: "Bank & card fees",
  rent: "Rent",
  utilities: "Utilities",
  professional_services: "Professional services",
  travel: "Travel",
  equipment: "Equipment",
  uncategorised: "Uncategorised",
};

const RESOLVABLE_CATEGORIES = Object.keys(CATEGORY_LABELS).filter(
  (c) => c !== "uncategorised"
) as TransactionCategory[];

export function StepReviewTransactions({
  transactions,
  onTransactionUpdated,
  canContinue,
  onBack,
  onContinue,
}: StepReviewTransactionsProps) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(transactionId: string, category: TransactionCategory) {
    setError(null);
    try {
      const updated = await categoriseTransaction(transactionId, category);
      onTransactionUpdated(updated);
      setResolvingId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save that category — try again.");
    }
  }

  return (
    <div className="step-panel">
      <div className="step-eyebrow">Step 2 of 4</div>
      <h2>Review your transactions</h2>
      <p className="lede">We've sorted these automatically. Check anything we've flagged, then move on.</p>

      <table className="txn-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr key={txn.id} className={txn.needsReview ? "txn-flag" : undefined}>
              <td className="num">
                {new Date(txn.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              </td>
              <td>
                {txn.description}
                {txn.needsReview && resolvingId !== txn.id && (
                  <div className="txn-flag-note">
                    Not sure what this is —{" "}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setResolvingId(txn.id);
                      }}
                    >
                      tell us
                    </a>
                  </div>
                )}
                {resolvingId === txn.id && (
                  <div className="txn-flag-note">
                    <select
                      defaultValue=""
                      onChange={(e) => resolve(txn.id, e.target.value as TransactionCategory)}
                      aria-label={`Category for ${txn.description}`}
                    >
                      <option value="" disabled>
                        Choose a category…
                      </option>
                      {RESOLVABLE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </td>
              <td>{CATEGORY_LABELS[txn.category]}</td>
              <td className="txn-amt num">{formatMinorAsGBP(txn.amountMinor, { showSign: true })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {error && <p className="txn-flag-note">{error}</p>}

      <div className="step-nav">
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn-primary" disabled={!canContinue} onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
