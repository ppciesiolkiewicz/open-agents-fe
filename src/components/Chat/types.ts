import type { ActivityLogEntry, ChatMessageView } from "@/sdk";

export type Message = ChatMessageView;

export type EphemeralPayload =
  | { type: "token"; text: string }
  | { type: "task_queued"; position: number; trigger?: string }
  | { type: "task_started"; trigger?: string }
  | { type: "task_finished"; trigger?: string }
  | { type: string; [key: string]: unknown };

export type StreamEvent =
  | { type: "append"; entry: ActivityLogEntry }
  | { type: "ephemeral"; payload: EphemeralPayload };
