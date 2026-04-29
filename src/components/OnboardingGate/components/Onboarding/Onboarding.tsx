"use client";

import { Button } from "@/ui/Button";
import { useUserWallet } from "@/hooks/useUserWallet";
import { WelcomeCard } from "./components/WelcomeCard/WelcomeCard";
import { TopUpCard } from "./components/TopUpCard/TopUpCard";
import { BuyCreditsCard } from "./components/BuyCreditsCard/BuyCreditsCard";

export interface OnboardingProps {
  onDone: () => void;
}

export function Onboarding({ onDone }: OnboardingProps) {
  const wallet = useUserWallet();

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <WelcomeCard />
        <TopUpCard wallet={wallet} />
        <BuyCreditsCard />
        <Button size="lg" onClick={onDone} className="self-end">
          Get started
        </Button>
      </div>
    </div>
  );
}
