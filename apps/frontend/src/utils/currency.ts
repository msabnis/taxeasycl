/** Formats minor units (pence) as a plain-English GBP string, e.g. 124760 -> "£1,247.60". */
export function formatMinorAsGBP(amountMinor: number, options: { showSign?: boolean } = {}): string {
  const pounds = Math.abs(amountMinor) / 100;
  const formatted = `£${pounds.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (options.showSign && amountMinor < 0) return `\u2212${formatted}`;
  return formatted;
}
