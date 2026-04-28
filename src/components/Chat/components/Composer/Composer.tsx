"use client";

import { useState, type KeyboardEvent } from "react";
import { Button } from "@/ui/Button";
import { Spinner } from "@/ui/Spinner";
import { Textarea } from "@/ui/Textarea";

export interface ComposerProps {
  onSubmit: (content: string) => void;
  disabled?: boolean;
  streaming?: boolean;
  onAbort?: () => void;
}

export function Composer({
  onSubmit,
  disabled,
  streaming,
  onAbort,
}: ComposerProps) {
  const [value, setValue] = useState("");

  function send() {
    const trimmed = value.trim();
    if (!trimmed || disabled || streaming) return;
    onSubmit(trimmed);
    setValue("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-black">
      <Textarea
        rows={1}
        value={value}
        placeholder="Message the agent…  (Enter to send, Shift+Enter for newline)"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-label="Message"
        className="min-h-10"
      />
      {streaming && onAbort ? (
        <Button variant="secondary" onClick={onAbort} aria-label="Stop">
          Stop
        </Button>
      ) : (
        <Button
          onClick={send}
          disabled={disabled || !value.trim()}
          loading={streaming}
        >
          {streaming ? <Spinner size="sm" /> : <span>Send</span>}
        </Button>
      )}
    </div>
  );
}
