"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Checkbox } from "@/shared/ui/Checkbox";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface MultiSelectFilterProps<T extends string> {
  title: string;
  options: readonly Option<T>[];
  selected: readonly T[];
  onApply: (selected: T[]) => void;
}

export function MultiSelectFilter<T extends string>({
  title,
  options,
  selected,
  onApply,
}: MultiSelectFilterProps<T>) {
  const [draft, setDraft] = useState<readonly T[]>(selected);

  function toggle(value: T, checked: boolean) {
    setDraft((current) =>
      checked ? [...current, value] : current.filter((item) => item !== value),
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onApply([...draft]);
      }}
    >
      <fieldset>
        <legend className="mb-2 font-semibold text-ink-strong">{title}</legend>
        <ul className="flex max-h-[240px] flex-col overflow-y-auto">
          {options.map((option) => (
            <li key={option.value}>
              <label className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-1 hover:bg-subtle">
                <Checkbox
                  aria-label={option.label}
                  checked={draft.includes(option.value)}
                  onCheckedChange={(checked) => toggle(option.value, checked)}
                />
                <span aria-hidden>{option.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
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
