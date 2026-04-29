"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { setApiAccessTokenGetter } from "@/lib/api";

export function ApiTokenSync() {
  const { ready, authenticated, getAccessToken } = usePrivy();

  useEffect(() => {
    if (ready && authenticated) {
      setApiAccessTokenGetter(async () => (await getAccessToken()) ?? null);
    } else {
      setApiAccessTokenGetter(async () => null);
    }
  }, [ready, authenticated, getAccessToken]);

  return null;
}
