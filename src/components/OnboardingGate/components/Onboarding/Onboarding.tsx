"use client";

import { Button } from "@/ui/Button";
import { useUserWallet } from "@/hooks/useUserWallet";
import { WelcomeCard } from "./components/WelcomeCard/WelcomeCard";
import { TopUpCard } from "./components/TopUpCard/TopUpCard";
import { BuyCreditsCard } from "./components/BuyCreditsCard/BuyCreditsCard";

export interface OnboardingProps {
  onDone: () => void;
  onClose: () => void;
  closeable?: boolean;
}

export function Onboarding({ onDone, onClose, closeable = false }: OnboardingProps) {
  const wallet = useUserWallet();

  return (
    <div className="relative flex min-h-dvh items-center justify-center p-6">
      {closeable && (
        <button
          type="button"
          aria-label="Close onboarding"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ×
          </span>
        </button>
      )}
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
