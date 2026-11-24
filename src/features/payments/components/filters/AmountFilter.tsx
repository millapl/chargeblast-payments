"use client";

import { useId, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { parseAmountInput } from "../../domain/money";
import { TextInput } from "./TextInput";

interface AmountFilterProps {
  min: string | null;
  max: string | null;
  onApply: (value: { min: string | null; max: string | null }) => void;
}

export function AmountFilter({ min, max, onApply }: AmountFilterProps) {
  const id = useId();
  const [minValue, setMinValue] = useState(min ?? "");
  const [maxValue, setMaxValue] = useState(max ?? "");
  const [errors, setErrors] = useState<{ min?: string; max?: string }>({});

  function submit() {
    const nextErrors: { min?: string; max?: string } = {};
    const lower = minValue.trim() === "" ? null : parseAmountInput(minValue);
    const upper = maxValue.trim() === "" ? null : parseAmountInput(maxValue);
    if (minValue.trim() !== "" && lower === null)
      nextErrors.min = "Use a number like 12 or 12.50.";
    if (maxValue.trim() !== "" && upper === null)
      nextErrors.max = "Use a number like 12 or 12.50.";
    if (lower !== null && upper !== null && lower > upper) {
      nextErrors.min = "Minimum must not exceed maximum.";
    }
    setErrors(nextErrors);
    if (nextErrors.min || nextErrors.max) return;
    onApply({ min: minValue.trim() || null, max: maxValue.trim() || null });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <p className="mb-2 font-semibold text-ink-strong">Amount</p>
      <div className="grid grid-cols-2 gap-2">
        <TextInput
          id={`${id}-min`}
          label="Minimum"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          value={minValue}
          error={errors.min}
          onChange={(event) => setMinValue(event.target.value)}
        />
        <TextInput
          id={`${id}-max`}
          label="Maximum"
          inputMode="decimal"
          autoComplete="off"
          placeholder="No limit"
          value={maxValue}
          error={errors.max}
          onChange={(event) => setMaxValue(event.target.value)}
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        Compares nominal amounts across currencies; no currency conversion is
        applied.
      </p>
      <Button
        type="submit"
        variant="primary"
        className="mt-3 w-full justify-center"
      >
        Apply
      </Button>
    </form>
  );
}
