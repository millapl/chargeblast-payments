"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { MAX_SEARCH_LENGTH } from "../domain/types";
import { usePaymentsUrlState } from "../hooks/usePaymentsUrlState";

const DEBOUNCE_MS = 300;

interface SearchFieldProps {
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

function SearchField({ value, onChange, disabled }: SearchFieldProps) {
  return (
    <>
      <Search
        aria-hidden
        size={14}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-icon"
      />
      <input
        type="search"
        name="q"
        aria-label="Search payments by ID, email or last 4 digits"
        placeholder="Search"
        autoComplete="off"
        maxLength={MAX_SEARCH_LENGTH}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-[35px] w-full rounded-md bg-subtle pr-3 pl-8 text-body text-ink outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent-text"
      />
    </>
  );
}

export function SearchBox() {
  const [values, setValues] = usePaymentsUrlState();
  const [text, setText] = useState(values.q);
  const lastPushed = useRef(values.q);

  useEffect(() => {
    if (values.q !== lastPushed.current) {
      lastPushed.current = values.q;
      setText(values.q);
    }
  }, [values.q]);

  useEffect(() => {
    const next = text.trim();
    if (next === lastPushed.current) return;
    const timer = setTimeout(() => {
      lastPushed.current = next;
      void setValues({ q: next, page: 1 });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, setValues]);

  return (
    <form
      role="search"
      className="relative w-[545px] max-w-full max-lg:min-w-0 max-lg:flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        const next = text.trim();
        lastPushed.current = next;
        void setValues({ q: next, page: 1 });
      }}
    >
      <SearchField value={text} onChange={setText} />
    </form>
  );
}

export function SearchBoxFallback() {
  return (
    <div className="relative w-[545px] max-w-full max-lg:min-w-0 max-lg:flex-1">
      <SearchField value="" disabled />
    </div>
  );
}
