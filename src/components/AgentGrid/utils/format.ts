export function formatRelativeSeconds(
  value: number | null | undefined,
): string | null {
  if (!value) return null;
  const seconds = value > 1e12 ? Math.floor(value / 1000) : value;
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 0) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function formatInterval(ms: number | null | undefined): string | null {
  if (!ms) return null;
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${Math.round(ms / 3_600_000)}h`;
}
