import { useState } from "react";
import { Stamp } from "../Stamp";

interface StepSubmitProps {
  amountDue: string;
  merchantName: string;
  periodLabel: string;
  onBack: () => void;
  onDone: () => void;
}

export function StepSubmit({ amountDue, merchantName, periodLabel, onBack, onDone }: StepSubmitProps) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="step-panel">
        <div className="submitted-view">
          <Stamp className="stamp-big" label="SUBMITTED" date="20 JUL 2026" size="big" animate />
          <h2>Done — HMRC has it</h2>
          <p>Confirmation reference sent to your email. Your next VAT return is due in October.</p>
          <button className="btn-primary" onClick={onDone}>
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="step-panel">
      <div className="step-eyebrow">Step 4 of 4</div>
      <h2>Submit to HMRC</h2>
      <p className="lede">
        You're submitting your {periodLabel} VAT return for {merchantName}. Once sent, HMRC will
        confirm receipt straight away.
      </p>
      <div className="vat-figures">
        <div className="vat-row total">
          <span>Amount due</span>
          <span className="num">{amountDue}</span>
        </div>
      </div>
      <div className="step-nav">
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn-primary" onClick={() => setSubmitted(true)}>
          Submit to HMRC
        </button>
      </div>
    </div>
  );
}
