"use client";

import { buildTransakUrl } from "@/lib/transak";
import { useUserWallet } from "@/hooks/useUserWallet";
import { Button } from "@/ui/Button";

export function TopUpButton() {
  const wallet = useUserWallet();
  if (!wallet) return null;

  return (
    <a
      href={buildTransakUrl(wallet.walletAddress)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button variant="secondary" size="sm">
        Top up
      </Button>
    </a>
  );
}
