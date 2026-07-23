import { useCallback, useEffect, useState } from "react";
import type { Filing } from "@ledgerly/shared";
import { ApiError, getCurrentMerchant, getFilings, type Merchant } from "./api/client";
import { Dashboard } from "./components/Dashboard";
import { Wizard } from "./components/wizard/Wizard";
import "./styles/tokens.css";

type Screen = "dashboard" | "wizard";

function merchantInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function App() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [filings, setFilings] = useState<Filing[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [activeFiling, setActiveFiling] = useState<Filing | null>(null);

  const loadFilings = useCallback(async (merchantId: string) => {
    const fetched = await getFilings(merchantId);
    setFilings(fetched);
    return fetched;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const currentMerchant = await getCurrentMerchant();
        setMerchant(currentMerchant);
        await loadFilings(currentMerchant.id);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not reach the Ledgerly backend.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadFilings]);

  async function handleBackToDashboard() {
    setScreen("dashboard");
    setActiveFiling(null);
    if (merchant) await loadFilings(merchant.id); // pick up progress made in the wizard
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="screen">
          <p>Loading your tax position…</p>
        </div>
      </div>
    );
  }

  if (error || !merchant) {
    return (
      <div className="app-shell">
        <div className="screen">
          <h1>Couldn't load Ledgerly</h1>
          <p className="lede">{error ?? "Unknown error."}</p>
          <p className="lede">
            Is the backend running? <code>npm run dev:backend</code>, and has it been seeded?{" "}
            <code>npm run db:seed --workspace apps/backend</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="wordmark">
          <span className="mark" />
          Ledgerly
        </div>
        <div className="merchant-chip">
          <span>{merchant.name}</span>
          <span className="avatar">{merchantInitials(merchant.name)}</span>
        </div>
      </div>

      {screen === "dashboard" ? (
        <Dashboard
          merchant={merchant}
          filings={filings ?? []}
          onContinueFiling={(filing) => {
            setActiveFiling(filing);
            setScreen("wizard");
          }}
        />
      ) : activeFiling ? (
        <Wizard merchant={merchant} filing={activeFiling} onBackToDashboard={handleBackToDashboard} />
      ) : null}
    </div>
  );
}
