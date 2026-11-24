"use client";

import { Button } from "@/shared/ui/Button";
import { PAGE_SIZES, type PageSize } from "../domain/types";
import { usePaymentsUrlState } from "../hooks/usePaymentsUrlState";

interface PaginationProps {
  firstIndex: number;
  lastIndex: number;
  total: number;
  page: number;
  pageCount: number;
  size: PageSize;
}

export function Pagination({
  firstIndex,
  lastIndex,
  total,
  page,
  pageCount,
  size,
}: PaginationProps) {
  const [, setValues] = usePaymentsUrlState();

  const summary =
    total === 0
      ? "No results"
      : `Viewing ${firstIndex}–${lastIndex} of ${total.toLocaleString("en-US")} results`;

  return (
    <div className="flex items-center justify-between gap-4 pt-[19px] pb-3">
      <p aria-live="polite" className="text-body text-muted">
        {summary}
      </p>
      <div className="flex items-center gap-1.5">
        <label className="flex items-center gap-2 text-body text-muted">
          <span className="max-sm:sr-only">Rows per page</span>
          <select
            value={size}
            onChange={(event) => {
              const next = PAGE_SIZES.find(
                (option) => option === Number(event.target.value),
              );
              if (next) void setValues({ size: next, page: 1 });
            }}
            className="h-6 rounded-md bg-white px-2 text-[12.5px] font-semibold text-ink ring-1 ring-control hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
          >
            {PAGE_SIZES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <Button
          size="sm"
          disabled={page <= 1}
          onClick={() => void setValues({ page: page - 1 })}
        >
          Previous
        </Button>
        <Button
          size="sm"
          disabled={page >= pageCount}
          onClick={() => void setValues({ page: page + 1 })}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
