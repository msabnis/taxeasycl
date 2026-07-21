import type { Transaction } from "@ledgerly/shared";

interface StepReviewTransactionsProps {
  transactions: Transaction[];
  onBack: () => void;
  onContinue: () => void;
}

function formatAmount(amountMinor: number): string {
  const pounds = Math.abs(amountMinor) / 100;
  const sign = amountMinor < 0 ? "\u2212" : "";
  return `${sign}£${pounds.toFixed(2)}`;
}

const CATEGORY_LABELS: Record<string, string> = {
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

export function StepReviewTransactions({
  transactions,
  onBack,
  onContinue,
}: StepReviewTransactionsProps) {
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
                {txn.needsReview && (
                  <div className="txn-flag-note">
                    Not sure what this is —{" "}
                    <a href="#" onClick={(e) => e.preventDefault()}>
                      tell us
                    </a>
                  </div>
                )}
              </td>
              <td>{CATEGORY_LABELS[txn.category] ?? txn.category}</td>
              <td className="txn-amt num">{formatAmount(txn.amountMinor)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="step-nav">
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn-primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
