"use client";

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
  const { create, creating, error } = useCreateAgent();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New agent"
      description="Configure a new runner. You can change name, prompt, risk limits, and interval later."
      className="left-0 top-0 h-dvh w-screen max-h-dvh max-w-none translate-x-0 translate-y-0 rounded-none border-0 px-20 py-6 sm:px-28 sm:py-8 lg:px-48"
    >
      <AgentCreateForm
        creating={creating}
        serverError={error}
        onCancel={() => onOpenChange(false)}
        onSubmit={async (body) => {
          const created = await create(body);
          if (created) {
            onOpenChange(false);
          }
        }}
      />
    </Dialog>
  );
}
