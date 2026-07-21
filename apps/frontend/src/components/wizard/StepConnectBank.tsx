import { useState } from "react";

export type BankChoice = "connect" | "upload" | null;

interface StepConnectBankProps {
  initialChoice: BankChoice;
  onContinue: (choice: BankChoice) => void;
}

export function StepConnectBank({ initialChoice, onContinue }: StepConnectBankProps) {
  const [choice, setChoice] = useState<BankChoice>(initialChoice);

  return (
    <div className="step-panel">
      <div className="step-eyebrow">Step 1 of 4</div>
      <h2>Let's get your numbers</h2>
      <p className="lede">
        Connect your bank so we can pull in transactions automatically, or upload a statement if
        you'd rather do it manually.
      </p>

      <div
        className={`choice-card${choice === "connect" ? " selected" : ""}`}
        onClick={() => setChoice("connect")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setChoice("connect")}
      >
        <span className="choice-radio" />
        <div>
          <div className="choice-title">Connect your bank account</div>
          <div className="choice-sub">
            Takes about a minute. We'll pull in new transactions automatically every quarter.
          </div>
        </div>
      </div>

      <div
        className={`choice-card${choice === "upload" ? " selected" : ""}`}
        onClick={() => setChoice("upload")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setChoice("upload")}
      >
        <span className="choice-radio" />
        <div>
          <div className="choice-title">Upload a statement instead</div>
          <div className="choice-sub">Prefer to do it manually? Upload a PDF or CSV from your bank.</div>
        </div>
      </div>

      <div className="step-nav">
        <button className="btn-primary" disabled={!choice} onClick={() => onContinue(choice)}>
          Continue
        </button>
      </div>
    </div>
  );
}
