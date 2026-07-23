import { useEffect, useState } from "react";
import type { Filing, Transaction } from "@ledgerly/shared";
import { ApiError, getTransactions, getVatFigures, updateFiling, type Merchant, type VatFiguresResponse } from "../../api/client";
import { StepConnectBank, type BankChoice } from "./StepConnectBank";
import { StepReviewTransactions } from "./StepReviewTransactions";
import { StepCheckFigures } from "./StepCheckFigures";
import { StepSubmit } from "./StepSubmit";
import { DEMO_PERIOD } from "../../constants";

const STEP_LABELS = [
  "Connect your bank",
  "Review your transactions",
  "Check the figures",
  "Submit to HMRC",
];

interface WizardProps {
  merchant: Merchant;
  filing: Filing;
  onBackToDashboard: () => void;
}

export function Wizard({ merchant, filing, onBackToDashboard }: WizardProps) {
  // Resume where the merchant left off, same as the dashboard's progress dots imply.
  const [currentStep, setCurrentStep] = useState(Math.max(1, filing.stepsCompleted));
  const [bankChoice, setBankChoice] = useState<BankChoice>("connect");

  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  const [vatFigures, setVatFigures] = useState<VatFiguresResponse | null>(null);
  const [figuresError, setFiguresError] = useState<{ message: string; unresolvedCount?: number } | null>(null);
  const [figuresLoading, setFiguresLoading] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load transactions once we reach Step 2 (or later, on resume).
  useEffect(() => {
    if (currentStep < 2 || transactions) return;
    getTransactions(merchant.id, DEMO_PERIOD.start, DEMO_PERIOD.end)
      .then(setTransactions)
      .catch((err) => setTransactionsError(err instanceof ApiError ? err.message : "Could not load transactions."));
  }, [currentStep, merchant.id, transactions]);

  async function persistProgress(stepsCompleted: number, extra?: Parameters<typeof updateFiling>[1]) {
    try {
      await updateFiling(filing.id, { stepsCompleted, status: "in_progress", ...extra });
    } catch {
      // Non-fatal — the merchant can still continue locally even if the
      // progress ping fails; it'll be corrected next time a step completes.
    }
  }

  async function goToStep3() {
    setCurrentStep(3);
    setFiguresLoading(true);
    setFiguresError(null);
    try {
      const result = await getVatFigures(merchant.id, DEMO_PERIOD.start, DEMO_PERIOD.end);
      setVatFigures(result);
    } catch (err) {
      if (err instanceof ApiError && err.code === "UNRESOLVED_TRANSACTIONS") {
        setFiguresError({ message: err.message, unresolvedCount: err.details?.unresolvedCount as number | undefined });
      } else {
        setFiguresError({ message: err instanceof ApiError ? err.message : "Could not calculate VAT figures." });
      }
    } finally {
      setFiguresLoading(false);
    }
  }

  const anyUnresolved = transactions?.some((t) => t.needsReview) ?? false;

  return (
    <div className="screen">
      <button className="wizard-back" onClick={onBackToDashboard}>
        ← Back to dashboard
      </button>

      <div className="wizard-layout">
        <nav className="ledger-rail" aria-label="Guided VAT return steps">
          <ol>
            {STEP_LABELS.map((label, i) => {
              const step = i + 1;
              const state = step < currentStep ? "done" : step === currentStep ? "active" : "";
              return (
                <li key={step} className={`rail-step ${state}`.trim()}>
                  <span className="rail-marker">{step}</span>
                  <span className="rail-label">{label}</span>
                </li>
              );
            })}
          </ol>
        </nav>

        <div>
          {currentStep === 1 && (
            <StepConnectBank
              initialChoice={bankChoice}
              onContinue={(choice) => {
                setBankChoice(choice);
                setCurrentStep(2);
                void persistProgress(1);
              }}
            />
          )}

          {currentStep === 2 && (
            <>
              {transactionsError && <p className="lede">{transactionsError}</p>}
              {!transactionsError && !transactions && <p className="lede">Loading your transactions…</p>}
              {transactions && (
                <StepReviewTransactions
                  transactions={transactions}
                  onTransactionUpdated={(updated) =>
                    setTransactions((prev) => prev?.map((t) => (t.id === updated.id ? updated : t)) ?? null)
                  }
                  canContinue={!anyUnresolved}
                  onBack={() => setCurrentStep(1)}
                  onContinue={() => {
                    void persistProgress(2);
                    void goToStep3();
                  }}
                />
              )}
            </>
          )}

          {currentStep === 3 && (
            <>
              {figuresLoading && <p className="lede">Working out your VAT position…</p>}
              {figuresError && (
                <div className="step-panel">
                  <div className="step-eyebrow">Step 3 of 4</div>
                  <h2>A few transactions still need review</h2>
                  <p className="lede">{figuresError.message}</p>
                  <div className="step-nav">
                    <button className="btn-secondary" onClick={() => setCurrentStep(2)}>
                      Back to transactions
                    </button>
                  </div>
                </div>
              )}
              {vatFigures && !figuresLoading && !figuresError && (
                <StepCheckFigures
                  vatOnSales={formatFigure(vatFigures.figures.vatOnSalesMinor)}
                  vatReclaimed={formatFigure(vatFigures.figures.vatReclaimedMinor)}
                  netVatDue={formatFigure(vatFigures.figures.netVatDueMinor)}
                  onBack={() => setCurrentStep(2)}
                  onContinue={() => {
                    setCurrentStep(4);
                    void persistProgress(3);
                  }}
                />
              )}
            </>
          )}

          {currentStep === 4 && vatFigures && (
            <StepSubmit
              amountDue={formatFigure(vatFigures.figures.netVatDueMinor)}
              merchantName={merchant.name}
              periodLabel={DEMO_PERIOD.label}
              submitError={submitError}
              onBack={() => setCurrentStep(3)}
              onSubmit={async () => {
                setSubmitError(null);
                try {
                  await updateFiling(filing.id, {
                    status: "submitted",
                    stepsCompleted: 4,
                    outputSnapshot: vatFigures.figures,
                  });
                  return true;
                } catch (err) {
                  setSubmitError(err instanceof ApiError ? err.message : "Submission failed — please try again.");
                  return false;
                }
              }}
              onDone={onBackToDashboard}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function formatFigure(amountMinor: number): string {
  return `£${(amountMinor / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
