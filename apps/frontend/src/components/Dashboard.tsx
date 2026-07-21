import { useState } from "react";
import { StatusHero } from "./StatusHero";
import { ActionCard } from "./ActionCard";
import { LedgerList } from "./LedgerList";
import { merchant, currentPeriod } from "../data/mockData";

interface DashboardProps {
  onContinueVatReturn: () => void;
}

export function Dashboard({ onContinueVatReturn }: DashboardProps) {
  const [confirmationStatementReady, setConfirmationStatementReady] = useState(true);

  return (
    <div className="screen">
      <div className="greeting-row">
        <h1>Good morning, {merchant.contactFirstName}</h1>
        <span className="date">Monday, 20 July 2026</span>
      </div>

      <StatusHero
        headline="Nothing overdue"
        detail="Your VAT return is on schedule and one step is already done."
        asOfDate="20 JUL 2026"
      />

      <div className="cards-row">
        <ActionCard
          due={currentPeriod.dueDate}
          title={`VAT Return — ${currentPeriod.label}`}
          stepsCompleted={1}
          ctaLabel="Continue guided review"
          onAction={onContinueVatReturn}
        />
        <ActionCard
          due="14 Sept 2026"
          title="Confirmation statement"
          stepsCompleted={0}
          ctaLabel={confirmationStatementReady ? "Start" : "Coming soon"}
          ctaVariant="secondary"
          disabled={!confirmationStatementReady}
          onAction={() => setConfirmationStatementReady(false)}
        />
      </div>

      <LedgerList
        items={[
          {
            id: "a1",
            index: "01",
            description: "VAT Return — Q1 2026",
            detail: "Filed 12 Apr 2026",
            status: "filed",
          },
          {
            id: "a2",
            index: "02",
            description: "Bank statement uploaded",
            detail: "8 Jul 2026 · 214 transactions",
            status: "none",
          },
          {
            id: "a3",
            index: "03",
            description: "Confirmation statement",
            detail: "Draft saved",
            status: "continue",
          },
        ]}
      />
    </div>
  );
}
