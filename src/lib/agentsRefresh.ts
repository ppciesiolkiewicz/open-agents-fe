const AGENTS_REFRESH_EVENT = "agents:refresh";

export function emitAgentsRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AGENTS_REFRESH_EVENT));
}

export function subscribeAgentsRefresh(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AGENTS_REFRESH_EVENT, handler);
  return () => window.removeEventListener(AGENTS_REFRESH_EVENT, handler);
}
