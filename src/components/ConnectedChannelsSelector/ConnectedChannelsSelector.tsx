"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { AxlChannel } from "@/sdk";
import { Input } from "@/ui/Input";
import { ScrollArea } from "@/ui/ScrollArea";

export interface ConnectedChannelsSelectorProps {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

function toKey(value: string): string {
  return value.trim().toLowerCase();
}

function channelGlyph(name: string): string {
  const trimmed = name.trim().replace(/^#+\s*/, "");
  return trimmed.slice(0, 1).toUpperCase() || "#";
}

export function ConnectedChannelsSelector({
  value,
  onChange,
  disabled,
}: ConnectedChannelsSelectorProps) {
  const [channels, setChannels] = useState<AxlChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const list = await api.axlChannelsGet();
        if (active) setChannels(list);
      } catch (e) {
        if (active) {
          setLoadError(
            e instanceof Error ? e.message : "Failed to load channels",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const selected = useMemo(() => new Set(value.map(toKey)), [value]);

  const filtered = useMemo(() => {
    const q = toKey(search);
    if (!q) return channels;
    return channels.filter(
      (c) =>
        toKey(c.name).includes(q) || toKey(c.id).includes(q),
    );
  }, [channels, search]);

  function toggle(channelId: string) {
    const key = toKey(channelId);
    if (selected.has(key)) {
      onChange(value.filter((entry) => toKey(entry) !== key));
      return;
    }
    onChange([...value, channelId]);
  }

  return (
    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
        Select AXL channels this agent participates in. Selected memberships
        are applied when you save.
      </div>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search channels by name or id"
        disabled={disabled || loading}
      />
      <ScrollArea className="mt-2 h-36 rounded-md border border-zinc-200 dark:border-zinc-800">
        <div className="p-2">
          {loading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading channels...
            </p>
          ) : loadError ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {loadError}
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {channels.length === 0
                ? "No channels yet. Create one from the agents page."
                : "No channels match your search."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filtered.map((channel) => {
                const checked = selected.has(toKey(channel.id));
                const label = channel.name.startsWith("#")
                  ? channel.name
                  : `#${channel.name}`;
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => toggle(channel.id)}
                    disabled={disabled}
                    className={[
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
                      checked
                        ? "border-amber-700 bg-amber-900 text-amber-50 dark:border-amber-500 dark:bg-amber-800 dark:text-amber-100"
                        : "border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/70",
                      disabled ? "cursor-not-allowed opacity-60" : "",
                    ].join(" ")}
                    title={channel.id}
                  >
                    <span
                      className={[
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        checked
                          ? "bg-amber-100/25 text-amber-100 dark:bg-amber-950/40 dark:text-amber-50"
                          : "bg-amber-200 text-amber-950 dark:bg-amber-800 dark:text-amber-100",
                      ].join(" ")}
                      aria-hidden
                    >
                      {channelGlyph(channel.name)}
                    </span>
                    <span className="max-w-[12rem] truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
