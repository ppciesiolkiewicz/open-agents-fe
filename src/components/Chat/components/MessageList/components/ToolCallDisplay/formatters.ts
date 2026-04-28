export function safeParseJson<T = unknown>(raw: string | undefined): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function truncateAddress(addr: string, head = 6, tail = 4): string {
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function formatWei(raw: string, decimals = 18, symbol = "ETH"): string {
  let big: bigint;
  try {
    big = BigInt(raw);
  } catch {
    return `${raw} wei`;
  }
  const ZERO = BigInt(0);
  if (big === ZERO) return `0 ${symbol}`;

  const negative = big < ZERO;
  const abs = negative ? -big : big;
  const base = BigInt(10) ** BigInt(decimals);
  const whole = abs / base;
  const fraction = abs % base;

  const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, 6).replace(/0+$/, "");
  const result = fractionStr ? `${whole.toString()}.${fractionStr}` : whole.toString();
  return `${negative ? "-" : ""}${result} ${symbol}`;
}

export function formatTokenAmount(raw: string): string {
  let big: bigint;
  try {
    big = BigInt(raw);
  } catch {
    return raw;
  }
  return big.toLocaleString("en-US");
}

export function formatTimestamp(ms: number): string {
  if (!Number.isFinite(ms)) return "";
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    month: "short",
    day: "numeric",
  });
}

export function formatUSD(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (value >= 1) {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
  }
  return `$${value.toPrecision(4)}`;
}
