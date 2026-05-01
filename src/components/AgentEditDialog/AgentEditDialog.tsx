"use client";

import { Dialog } from "@/ui/Dialog";
import type { AgentConfig } from "@/sdk";
import { AgentEditForm } from "./components/AgentEditForm";
import { useUpdateAgent } from "./hooks/useUpdateAgent";

export interface AgentEditDialogProps {
  agent: AgentConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (next: AgentConfig) => void;
}

export function AgentEditDialog({
  agent,
  open,
  onOpenChange,
  onSaved,
}: AgentEditDialogProps) {
  const { update, saving, error } = useUpdateAgent(agent.id);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit agent"
      description={agent.name}
      className="left-0 top-0 h-dvh w-screen max-h-dvh max-w-none translate-x-0 translate-y-0 rounded-none border-0 px-6 py-6 sm:px-10 sm:py-8 lg:px-16"
    >
      <AgentEditForm
        agent={agent}
        saving={saving}
        serverError={error}
        onCancel={() => onOpenChange(false)}
        onSubmit={async (body) => {
          const next = await update(body);
          if (next) {
            onSaved(next);
            onOpenChange(false);
          }
        }}
      />
    </Dialog>
  );
}
