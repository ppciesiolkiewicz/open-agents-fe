import { Card } from "@/ui/Card";

export function WelcomeCard() {
  return (
    <Card className="gap-2">
      <h2 className="text-xl font-semibold">Welcome to Agora</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Your account is ready. Complete the steps below to get started — you
        can always come back to them later from the top bar.
      </p>
    </Card>
  );
}
