"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { SORT_LABELS } from "../domain/labels";
import { ariaSortFor, nextSort } from "../domain/sort";
import { toPaymentsQuery } from "../domain/url-state";
import type { SortKey } from "../domain/types";
import { usePaymentsUrlState } from "../hooks/usePaymentsUrlState";

interface SortHeaderProps {
  sortKey: SortKey;
  align?: "left" | "right";
}

export function SortHeader({ sortKey, align = "left" }: SortHeaderProps) {
  const [values, setValues] = usePaymentsUrlState();
  const { sort } = toPaymentsQuery(values);
  const direction = ariaSortFor(sort, sortKey);
  const label = SORT_LABELS[sortKey];

  function onClick() {
    const next = nextSort(sort, sortKey);
    void setValues({
      sort: next.map((spec) => `${spec.key}:${spec.dir}`),
      page: 1,
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        direction === "none"
          ? `Sort by ${label}`
          : `${label}, sorted ${direction}. Activate to reverse the order`
      }
      className={cn(
        "group/sort inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-ink-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text",
        align === "right" && "flex-row-reverse",
      )}
    >
      {label}
      <span aria-hidden className="flex size-3 items-center justify-center">
        {direction === "ascending" && <ArrowUp size={12} strokeWidth={2.5} />}
        {direction === "descending" && (
          <ArrowDown size={12} strokeWidth={2.5} />
        )}
        {direction === "none" && (
          <ArrowDown
            size={12}
            strokeWidth={2.5}
            className="text-icon opacity-0 group-hover/sort:opacity-100 group-focus-visible/sort:opacity-100"
          />
        )}
      </span>
    </button>
  );
}
