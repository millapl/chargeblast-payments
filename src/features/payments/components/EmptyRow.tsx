"use client";

import { Button } from "@/shared/ui/Button";
import { clearedFilters, hasActiveFilters } from "../domain/filter-summary";
import { toPaymentsQuery } from "../domain/url-state";
import { usePaymentsUrlState } from "../hooks/usePaymentsUrlState";

export function EmptyRow({ colSpan }: { colSpan: number }) {
  const [values, setValues] = usePaymentsUrlState();
  const filtered = hasActiveFilters(toPaymentsQuery(values));

  return (
    <tr>
      <td colSpan={colSpan} className="h-[160px] text-center">
        <p className="font-semibold text-ink-strong">No payments found</p>
        <p className="mt-1 text-muted">
          {filtered
            ? "No payments match the current filters."
            : "There are no payments to show."}
        </p>
        {filtered && (
          <Button
            className="mt-3"
            onClick={() => void setValues(clearedFilters())}
          >
            Clear filters
          </Button>
        )}
      </td>
    </tr>
  );
}
