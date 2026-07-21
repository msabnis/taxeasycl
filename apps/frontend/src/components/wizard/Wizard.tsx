import { useState } from "react";
import { StepConnectBank, type BankChoice } from "./StepConnectBank";
import { StepReviewTransactions } from "./StepReviewTransactions";
import { StepCheckFigures } from "./StepCheckFigures";
import { StepSubmit } from "./StepSubmit";
import { sampleTransactions, sampleVatFigures, merchant, currentPeriod } from "../../data/mockData";

const STEP_LABELS = [
  "Connect your bank",
  "Review your transactions",
  "Check the figures",
  "Submit to HMRC",
];

interface WizardProps {
  /** Which step to open on, e.g. 2 if Step 1 was already completed on a previous visit. */
  startAtStep?: number;
  onBackToDashboard: () => void;
}

export function Wizard({ startAtStep = 1, onBackToDashboard }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(startAtStep);
  const [bankChoice, setBankChoice] = useState<BankChoice>("connect");

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
              }}
            />
          )}
          {currentStep === 2 && (
            <StepReviewTransactions
              transactions={sampleTransactions}
              onBack={() => setCurrentStep(1)}
              onContinue={() => setCurrentStep(3)}
            />
          )}
          {currentStep === 3 && (
            <StepCheckFigures
              vatOnSales={sampleVatFigures.vatOnSales}
              vatReclaimed={sampleVatFigures.vatReclaimed}
              netVatDue={sampleVatFigures.netVatDue}
              onBack={() => setCurrentStep(2)}
              onContinue={() => setCurrentStep(4)}
            />
          )}
          {currentStep === 4 && (
            <StepSubmit
              amountDue={sampleVatFigures.netVatDue}
              merchantName={merchant.name}
              periodLabel={currentPeriod.label}
              onBack={() => setCurrentStep(3)}
              onDone={onBackToDashboard}
            />
          )}
        </div>
      </div>
    </div>
  );
}
