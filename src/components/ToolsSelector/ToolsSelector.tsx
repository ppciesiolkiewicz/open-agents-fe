"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { ToolCatalogItem } from "@/sdk";

export interface ToolsSelectorProps {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

function toKey(value: string): string {
  return value.trim().toLowerCase();
}

async function fetchToolsCatalog(): Promise<ToolCatalogItem[]> {
  const response = await api.toolsGet();
  return response.tools;
}

export function ToolsSelector({ value, onChange, disabled }: ToolsSelectorProps) {
  const [tools, setTools] = useState<ToolCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadTools() {
      setLoading(true);
      setLoadError(null);
      try {
        const allTools = await fetchToolsCatalog();
        if (!active) return;

        const deduped = new Map<string, ToolCatalogItem>();
        for (const tool of allTools) {
          deduped.set(toKey(tool.id), tool);
        }
        setTools(Array.from(deduped.values()));
      } catch (error) {
        if (!active) return;
        setLoadError(
          error instanceof Error ? error.message : "Failed to load tools catalog",
        );
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadTools();
    return () => {
      active = false;
    };
  }, []);

  const selected = useMemo(() => new Set(value.map(toKey)), [value]);
  const allSelected =
    tools.length > 0 && tools.every((tool) => selected.has(toKey(tool.id)));

  function toggle(toolId: string) {
    const key = toKey(toolId);
    if (selected.has(key)) {
      onChange(value.filter((entry) => toKey(entry) !== key));
      return;
    }
    onChange([...value, toolId]);
  }

  function selectAll() {
    const merged = new Map(value.map((entry) => [toKey(entry), entry]));
    for (const tool of tools) {
      merged.set(toKey(tool.id), tool.id);
    }
    onChange(Array.from(merged.values()));
  }

  return (
    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading tools...</p>
      ) : loadError ? (
        <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
      ) : tools.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No tools available.
        </p>
      ) : (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              disabled={disabled || tools.length === 0 || allSelected}
              className="cursor-pointer text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-400 dark:text-zinc-300 dark:hover:text-zinc-100 dark:disabled:text-zinc-600"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={disabled || value.length === 0}
              className="cursor-pointer text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900 disabled:cursor-not-allowed disabled:text-zinc-400 dark:text-zinc-300 dark:hover:text-zinc-100 dark:disabled:text-zinc-600"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tools.map((tool) => {
              const checked = selected.has(toKey(tool.id));
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => toggle(tool.id)}
                  disabled={disabled}
                  className={[
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
                    checked
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
                    disabled ? "cursor-not-allowed opacity-60" : "",
                  ].join(" ")}
                  title={tool.description?.trim() || tool.name}
                >
                  {tool.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
