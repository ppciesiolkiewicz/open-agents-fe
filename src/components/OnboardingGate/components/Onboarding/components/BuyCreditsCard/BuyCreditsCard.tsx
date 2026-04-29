"use client";

import { useState } from "react";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";

export function BuyCreditsCard() {
  const [clicked, setClicked] = useState(false);

  return (
    <Card className="gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Step 2
        </span>
        <h3 className="text-base font-semibold">Buy AI computation credits</h3>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Convert your USDC into AI computation credits to run agents.
      </p>
      <div className="flex flex-col gap-2">
        <Button variant="secondary" onClick={() => setClicked(true)}>
          Buy AI credits
        </Button>
        {clicked && (
          <p className="text-xs text-zinc-400">
            Coming soon — this feature is on its way.
          </p>
        )}
      </div>
    </Card>
  );
}
