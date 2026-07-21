interface StepCheckFiguresProps {
  vatOnSales: string;
  vatReclaimed: string;
  netVatDue: string;
  onBack: () => void;
  onContinue: () => void;
}

export function StepCheckFigures({
  vatOnSales,
  vatReclaimed,
  netVatDue,
  onBack,
  onContinue,
}: StepCheckFiguresProps) {
  return (
    <div className="step-panel">
      <div className="step-eyebrow">Step 3 of 4</div>
      <h2>Check the figures</h2>
      <p className="lede">Here's what that works out to, in plain terms. Nothing is sent yet.</p>

      <div className="vat-figures">
        <div className="vat-row">
          <span>
            VAT you charged customers
            <span className="label-sub">On sales this quarter</span>
          </span>
          <span className="num">{vatOnSales}</span>
        </div>
        <div className="vat-row">
          <span>
            VAT you can reclaim
            <span className="label-sub">On purchases and expenses</span>
          </span>
          <span className="num">{vatReclaimed}</span>
        </div>
        <div className="vat-row total">
          <span>What you owe HMRC</span>
          <span className="num">{netVatDue}</span>
        </div>
      </div>

      <div className="step-nav">
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn-primary" onClick={onContinue}>
          Looks right, continue
        </button>
      </div>
    </div>
  );
}
