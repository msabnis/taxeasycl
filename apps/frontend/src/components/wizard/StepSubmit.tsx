import { useState } from "react";
import { Stamp } from "../Stamp";

interface StepSubmitProps {
  amountDue: string;
  merchantName: string;
  periodLabel: string;
  submitError: string | null;
  onBack: () => void;
  /** Returns true on success — the parent has already persisted the filing. */
  onSubmit: () => Promise<boolean>;
  onDone: () => void;
}

export function StepSubmit({
  amountDue,
  merchantName,
  periodLabel,
  submitError,
  onBack,
  onSubmit,
  onDone,
}: StepSubmitProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    const ok = await onSubmit();
    setSubmitting(false);
    if (ok) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="step-panel">
        <div className="submitted-view">
          <Stamp className="stamp-big" label="SUBMITTED" date={new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()} size="big" animate />
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
      {submitError && <p className="txn-flag-note">{submitError}</p>}
      <div className="step-nav">
        <button className="btn-secondary" onClick={onBack} disabled={submitting}>
          Back
        </button>
        <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit to HMRC"}
        </button>
      </div>
    </div>
  );
}
