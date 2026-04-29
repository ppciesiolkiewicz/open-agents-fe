"use client";

import { useUserWallet } from "@/hooks/useUserWallet";
import { useOnboarding } from "@/components/OnboardingGate";
import { Button } from "@/ui/Button";

export function TopUpButton() {
  const wallet = useUserWallet();
  const { open } = useOnboarding();
  if (!wallet) return null;

  return (
    <Button variant="secondary" onClick={open}>
      Top up
    </Button>
  );
}
