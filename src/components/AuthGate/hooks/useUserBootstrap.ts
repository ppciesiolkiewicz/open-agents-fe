"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchUserMe, postUserWallet } from "@/lib/userApi";
import type { MeResponse } from "@/lib/userApi";

export type BootstrapStatus = "idle" | "loading" | "ready" | "error";

interface UseUserBootstrapResult {
  status: BootstrapStatus;
  error: string | null;
  me: MeResponse | null;
  retry: () => void;
}

export function useUserBootstrap(enabled: boolean): UseUserBootstrapResult {
  const [status, setStatus] = useState<BootstrapStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    void (async () => {
      if (cancelled) return;
      setStatus("loading");
      setError(null);
      try {
        let next = await fetchUserMe();
        if (cancelled) return;
        const hasPrimary = next.wallets.some((w) => w.isPrimary);
        if (!hasPrimary) {
          await postUserWallet();
          if (cancelled) return;
          next = await fetchUserMe();
          if (cancelled) return;
        }
        setMe(next);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Bootstrap failed");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, tick]);

  const retry = useCallback(() => setTick((n) => n + 1), []);

  return { status, error, me, retry };
}
