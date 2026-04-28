"use client";

import { useRouter } from "next/navigation";
import { Dialog } from "@/ui/Dialog";
import { AgentCreateForm } from "./components/AgentCreateForm";
import { useCreateAgent } from "./hooks/useCreateAgent";

export interface AgentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentCreateDialog({
  open,
  onOpenChange,
}: AgentCreateDialogProps) {
  const router = useRouter();
  const { create, creating, error } = useCreateAgent();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New agent"
      description="Configure a new runner. You can change name, prompt, risk limits, and interval later."
    >
      <AgentCreateForm
        creating={creating}
        serverError={error}
        onCancel={() => onOpenChange(false)}
        onSubmit={async (body) => {
          const created = await create(body);
          if (created) {
            onOpenChange(false);
            router.push(`/agents/${created.id}`);
          }
        }}
      />
    </Dialog>
  );
}
