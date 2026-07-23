import type { Filing } from "@ledgerly/shared";
import { StatusHero } from "./StatusHero";
import { ActionCard } from "./ActionCard";
import { LedgerList } from "./LedgerList";
import type { Merchant } from "../api/client";

interface DashboardProps {
  merchant: Merchant;
  filings: Filing[];
  onContinueFiling: (filing: Filing) => void;
}

const FILING_TYPE_LABELS: Record<Filing["type"], string> = {
  vat_return: "VAT Return",
  confirmation_statement: "Confirmation statement",
  annual_accounts: "Annual accounts",
};

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(filing: Filing): boolean {
  return filing.status !== "submitted" && new Date(filing.dueDate) < new Date();
}

export function Dashboard({ merchant, filings, onContinueFiling }: DashboardProps) {
  const outstanding = filings.filter((f) => f.status !== "submitted");
  const overdue = outstanding.filter(isOverdue);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const firstName = merchant.name.split(/[\s']/)[0];

  return (
    <div className="screen">
      <div className="greeting-row">
        <h1>Good morning, {firstName}</h1>
        <span className="date">{today}</span>
      </div>

      <StatusHero
        headline={overdue.length > 0 ? "Something needs attention" : "Nothing overdue"}
        detail={
          overdue.length > 0
            ? `${overdue.length} filing${overdue.length > 1 ? "s are" : " is"} past due — take a look below.`
            : outstanding.length > 0
              ? `Your next filing is ${FILING_TYPE_LABELS[outstanding[0].type]}, due ${formatDueDate(outstanding[0].dueDate)}.`
              : "Everything's filed and up to date."
        }
        asOfDate={new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
      />

      {outstanding.length > 0 && (
        <div className="cards-row">
          {outstanding.map((filing) => (
            <ActionCard
              key={filing.id}
              due={formatDueDate(filing.dueDate)}
              title={FILING_TYPE_LABELS[filing.type]}
              stepsCompleted={filing.stepsCompleted}
              ctaLabel={filing.stepsCompleted > 0 ? "Continue guided review" : "Start"}
              onAction={() => onContinueFiling(filing)}
            />
          ))}
        </div>
      )}

      <LedgerList
        items={filings.map((filing, i) => ({
          id: filing.id,
          index: String(i + 1).padStart(2, "0"),
          description: FILING_TYPE_LABELS[filing.type],
          detail:
            filing.status === "submitted" && filing.submittedAt
              ? `Filed ${formatDueDate(filing.submittedAt)}`
              : filing.stepsCompleted > 0
                ? "Draft saved"
                : `Due ${formatDueDate(filing.dueDate)}`,
          status: filing.status === "submitted" ? "filed" : "continue",
          onContinue: () => onContinueFiling(filing),
        }))}
      />
    </div>
  );
}
