"use client";

import { forwardRef, useEffect, useState, type ChangeEvent } from "react";
import { Input } from "@/ui/Input";

export interface NumberInputProps {
  value: number | null;
  onChange: (next: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  id?: string;
  name?: string;
  "aria-label"?: string;
  className?: string;
}

function parseValue(raw: string): number | null {
  if (raw === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput({ value, onChange, ...rest }, ref) {
    const [raw, setRaw] = useState(() => (value === null ? "" : String(value)));

    useEffect(() => {
      if (parseValue(raw) !== value) {
        setRaw(value === null ? "" : String(value));
      }
    }, [value, raw]);

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      const next = e.target.value;
      setRaw(next);
      onChange(parseValue(next));
    }

    return (
      <Input
        ref={ref}
        type="number"
        value={raw}
        onChange={handleChange}
        {...rest}
      />
    );
  },
);
