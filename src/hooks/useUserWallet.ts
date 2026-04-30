import { useMe } from "@/components/AuthGate";
import type { MeWallet } from "@/lib/userApi";

export function useUserWallet(): MeWallet | null {
  const me = useMe();
  return me?.wallets.find((w) => w.isPrimary) ?? null;
}
