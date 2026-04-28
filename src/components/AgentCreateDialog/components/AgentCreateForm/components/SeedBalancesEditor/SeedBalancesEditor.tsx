"use client";

import { useState } from "react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";

export interface SeedBalancesEditorProps {
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  error?: string;
  disabled?: boolean;
}

interface Row {
  id: number;
  token: string;
  amount: string;
}

let nextId = 0;

function rowsFromValue(value: Record<string, string>): Row[] {
  return Object.entries(value).map(([token, amount]) => ({
    id: nextId++,
    token,
    amount,
  }));
}

function rowsToValue(rows: Row[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of rows) {
    if (r.token.trim()) out[r.token.trim()] = r.amount;
  }
  return out;
}

export function SeedBalancesEditor({
  value,
  onChange,
  error,
  disabled,
}: SeedBalancesEditorProps) {
  const [rows, setRows] = useState<Row[]>(() => rowsFromValue(value));

  function emit(next: Row[]) {
    setRows(next);
    onChange(rowsToValue(next));
  }

  function update(id: number, patch: Partial<Row>) {
    emit(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function remove(id: number) {
    emit(rows.filter((r) => r.id !== id));
  }

  function add() {
    emit([...rows, { id: nextId++, token: "", amount: "" }]);
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Seed balances
      </div>
      {rows.length === 0 && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          No balances. Add a row to seed the dry-run wallet.
        </p>
      )}
      {rows.map((row) => (
        <div key={row.id} className="grid grid-cols-[2fr_3fr_auto] gap-2">
          <Input
            value={row.token}
            placeholder="Token (e.g. USDC)"
            onChange={(e) => update(row.id, { token: e.target.value })}
            disabled={disabled}
            aria-label="Token"
          />
          <Input
            value={row.amount}
            placeholder="Amount"
            onChange={(e) => update(row.id, { amount: e.target.value })}
            disabled={disabled}
            aria-label="Amount"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(row.id)}
            disabled={disabled}
            aria-label="Remove row"
          >
            ×
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={add}
        disabled={disabled}
        className="self-start"
      >
        + Add balance
      </Button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
