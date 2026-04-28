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
