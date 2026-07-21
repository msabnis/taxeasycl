interface StampProps {
  label: string;
  date: string;
  size?: "small" | "big";
  animate?: boolean;
  className?: string;
}

/**
 * The circular ink-stamp motif that marks something as officially done —
 * used small in the dashboard's status hero and activity list, and full
 * size (with a stamp-down animation) on wizard completion.
 */
export function Stamp({ label, date, size = "small", animate = false, className }: StampProps) {
  const dimension = size === "big" ? 88 : 64;
  const labelFontSize = size === "big" ? 13 : 14;

  return (
    <svg
      className={[className, animate ? "stamp-animate" : ""].filter(Boolean).join(" ")}
      viewBox="0 0 120 120"
      width={dimension}
      height={dimension}
      aria-hidden="true"
    >
      <g transform="rotate(-9 60 60)">
        <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2 3"
        />
        <text
          x="60"
          y="57"
          textAnchor="middle"
          fontFamily="IBM Plex Mono, monospace"
          fontSize={labelFontSize}
          fontWeight="600"
          fill="currentColor"
          letterSpacing="1"
        >
          {label}
        </text>
        <text
          x="60"
          y="74"
          textAnchor="middle"
          fontFamily="IBM Plex Mono, monospace"
          fontSize="8"
          fill="currentColor"
          letterSpacing="2"
        >
          {date}
        </text>
      </g>
    </svg>
  );
}
