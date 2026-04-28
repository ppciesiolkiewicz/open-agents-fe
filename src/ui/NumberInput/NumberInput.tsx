"use client";

import { forwardRef, type ChangeEvent } from "react";
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

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput({ value, onChange, ...rest }, ref) {
    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value;
      if (raw === "") {
        onChange(null);
        return;
      }
      const parsed = Number(raw);
      onChange(Number.isFinite(parsed) ? parsed : null);
    }

    return (
      <Input
        ref={ref}
        type="number"
        value={value === null ? "" : String(value)}
        onChange={handleChange}
        {...rest}
      />
    );
  },
);
