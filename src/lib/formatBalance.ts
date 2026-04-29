export function truncateAmount(formatted: string, maxDecimals = 4): string {
  const [whole, decimal] = formatted.split(".");
  if (!decimal) return whole;
  const truncated = decimal.slice(0, maxDecimals);
  return truncated === "" ? whole : `${whole}.${truncated}`;
}
