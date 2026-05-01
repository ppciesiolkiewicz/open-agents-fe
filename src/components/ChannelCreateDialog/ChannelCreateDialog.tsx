"use client";

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { agentsQueryKey } from "@/lib/agentsQuery";
import { Button } from "@/ui/Button";
import { Dialog, DialogFooter } from "@/ui/Dialog";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";

export interface ChannelCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChannelCreateDialog({
  open,
  onOpenChange,
}: ChannelCreateDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedName = name.trim();
  const disabled = creating || trimmedName.length === 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (disabled) return;

    setError(null);
    setCreating(true);
    try {
      await api.axlChannelsPost({
        createAxlChannelBody: { name: trimmedName },
      });
      void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
      setName("");
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create channel");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setName("");
          setError(null);
        }
      }}
      title="New channel"
      description="Create an AXL channel that agents can join."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Channel name" htmlFor="create-channel-name">
          <Input
            id="create-channel-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={creating}
            autoFocus
          />
        </Field>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button type="submit" loading={creating} disabled={disabled}>
            Create
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
