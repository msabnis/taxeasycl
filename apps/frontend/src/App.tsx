import { useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { Wizard } from "./components/wizard/Wizard";
import { merchant } from "./data/mockData";
import "./styles/tokens.css";

type Screen = "dashboard" | "wizard";

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="wordmark">
          <span className="mark" />
          Ledgerly
        </div>
        <div className="merchant-chip">
          <span>{merchant.name}</span>
          <span className="avatar">{merchant.initials}</span>
        </div>
      </div>

      {screen === "dashboard" ? (
        <Dashboard onContinueVatReturn={() => setScreen("wizard")} />
      ) : (
        <Wizard startAtStep={2} onBackToDashboard={() => setScreen("dashboard")} />
      )}
    </div>
  );
}
