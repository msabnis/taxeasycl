interface LedgerListItem {
  id: string;
  index: string;
  description: string;
  detail: string;
  status: "filed" | "continue" | "none";
  onContinue?: () => void;
}

interface LedgerListProps {
  items: LedgerListItem[];
}

export function LedgerList({ items }: LedgerListProps) {
  return (
    <div className="ledger-list">
      <h3>Recent activity</h3>
      {items.map((item) => (
        <div className="ledger-row" key={item.id}>
          <span className="idx num">{item.index}</span>
          <div>
            {item.description}
            <div className="desc-date">{item.detail}</div>
          </div>
          {item.status === "filed" && (
            <span className="tag-filed">
              <span className="dot" />
              Filed
            </span>
          )}
          {item.status === "continue" && (
            <button className="btn-text" onClick={item.onContinue}>
              Continue
            </button>
          )}
          {item.status === "none" && <span />}
          <span />
        </div>
      ))}
    </div>
  );
}
