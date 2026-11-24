"use client";

import { useId, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { DATE_RANGE_LABELS } from "../../domain/filter-summary";
import { DISPLAY_TIME_ZONE, parseDateInput } from "../../domain/dates";
import type { DateRange } from "../../domain/types";
import { TextInput } from "./TextInput";

const CHOICES = [
  "today",
  "7d",
  "30d",
  "custom",
] as const satisfies readonly DateRange[];

interface DateFilterValue {
  range: DateRange;
  from: string | null;
  to: string | null;
}

interface DateFilterProps {
  value: DateFilterValue;
  onApply: (value: DateFilterValue) => void;
}

export function DateFilter({ value, onApply }: DateFilterProps) {
  const id = useId();
  const [range, setRange] = useState<DateRange>(value.range);
  const [from, setFrom] = useState(value.from ?? "");
  const [to, setTo] = useState(value.to ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (range !== "custom") {
      onApply({ range, from: null, to: null });
      return;
    }
    const start = from === "" ? null : parseDateInput(from);
    const end = to === "" ? null : parseDateInput(to);
    if ((from !== "" && !start) || (to !== "" && !end)) {
      setError("Enter valid dates.");
      return;
    }
    if (!start && !end) {
      setError("Choose a start date, an end date, or both.");
      return;
    }
    if (from !== "" && to !== "" && from > to) {
      setError("The start date must not be after the end date.");
      return;
    }
    onApply({ range, from: from || null, to: to || null });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <fieldset>
        <legend className="mb-2 font-semibold text-ink-strong">
          Date and time
        </legend>
        <ul className="flex flex-col">
          {CHOICES.map((choice) => (
            <li key={choice}>
              <label className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-1 hover:bg-subtle">
                <input
                  type="radio"
                  name={`${id}-range`}
                  value={choice}
                  checked={range === choice}
                  onChange={() => {
                    setRange(choice);
                    setError(null);
                  }}
                  className="size-4 accent-accent"
                />
                {DATE_RANGE_LABELS[choice]}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {range === "custom" && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TextInput
            id={`${id}-from`}
            label="From"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
          <TextInput
            id={`${id}-to`}
            label="To"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger-text">
          {error}
        </p>
      )}
      <p className="mt-2 text-xs text-muted">
        Days start at midnight in {DISPLAY_TIME_ZONE}.
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
