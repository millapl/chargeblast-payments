"use client";

import { useId, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { MAX_SEARCH_LENGTH } from "../../domain/types";
import { TextInput } from "./TextInput";

interface SearchFilterProps {
  value: string;
  onApply: (value: string) => void;
}

export function SearchFilter({ value, onApply }: SearchFilterProps) {
  const id = useId();
  const [draft, setDraft] = useState(value);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onApply(draft.trim());
      }}
    >
      <p className="mb-2 font-semibold text-ink-strong">More filters</p>
      <TextInput
        id={`${id}-q`}
        label="Payment ID, email or last 4 digits"
        type="search"
        autoComplete="off"
        maxLength={MAX_SEARCH_LENGTH}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
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
