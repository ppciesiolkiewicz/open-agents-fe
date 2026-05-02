export function truncateAmount(formatted: string, maxDecimals = 4): string {
  const [whole, decimal] = formatted.split(".");
  if (!decimal) return whole;
  const truncated = decimal.slice(0, maxDecimals);
  return truncated === "" ? whole : `${whole}.${truncated}`;
}

export function formatBaseUnits(
  raw: string,
  decimals: number,
  maxDecimals = 4,
): string {
  let big: bigint;
  try {
    big = BigInt(raw);
  } catch {
    return raw;
  }
  const negative = big < BigInt(0);
  const abs = negative ? -big : big;
  const base = BigInt(10) ** BigInt(decimals);
  const whole = (abs / base).toString();
  const fraction = (abs % base).toString().padStart(decimals, "0");
  const trimmed = fraction.slice(0, maxDecimals).replace(/0+$/, "");
  const result = trimmed ? `${whole}.${trimmed}` : whole;
  return negative ? `-${result}` : result;
}

export const USDC_DECIMALS = 6;
export const OG_DECIMALS = 18;
