import { Stamp } from "./Stamp";

interface StatusHeroProps {
  headline: string;
  detail: string;
  asOfDate: string;
}

export function StatusHero({ headline, detail, asOfDate }: StatusHeroProps) {
  return (
    <div className="status-hero">
      <Stamp className="stamp" label="ON TRACK" date={asOfDate} />
      <div className="status-copy">
        <div className="eyebrow">Your tax position</div>
        <h3>{headline}</h3>
        <p>{detail}</p>
      </div>
    </div>
  );
}
