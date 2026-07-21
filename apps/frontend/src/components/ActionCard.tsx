interface ActionCardProps {
  due: string;
  title: string;
  stepsCompleted: number;
  totalSteps?: number;
  ctaLabel: string;
  ctaVariant?: "primary" | "secondary";
  onAction: () => void;
  disabled?: boolean;
}

export function ActionCard({
  due,
  title,
  stepsCompleted,
  totalSteps = 4,
  ctaLabel,
  ctaVariant = "primary",
  onAction,
  disabled = false,
}: ActionCardProps) {
  return (
    <div className="action-card">
      <div className="due">Due {due}</div>
      <h3>{title}</h3>
      <div className="progress-dots">
        {Array.from({ length: totalSteps }, (_, i) => (
          <span key={i} className={i < stepsCompleted ? "done" : ""} />
        ))}
      </div>
      <button
        className={ctaVariant === "primary" ? "btn-primary" : "btn-secondary"}
        onClick={onAction}
        disabled={disabled}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
