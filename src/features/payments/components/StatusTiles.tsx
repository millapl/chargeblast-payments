"use client";

import { cn } from "@/shared/lib/cn";
import { STATUS_LABELS } from "../domain/labels";
import { toPaymentsQuery } from "../domain/url-state";
import type { PaymentStatus } from "../domain/types";
import { usePaymentsUrlState } from "../hooks/usePaymentsUrlState";

const TILES: readonly { label: string; status: PaymentStatus | null }[] = [
  { label: "All", status: null },
  { label: STATUS_LABELS.succeeded, status: "succeeded" },
  { label: STATUS_LABELS.refunded, status: "refunded" },
  { label: STATUS_LABELS.disputed, status: "disputed" },
  { label: STATUS_LABELS.failed, status: "failed" },
  { label: STATUS_LABELS.uncaptured, status: "uncaptured" },
];

export function StatusTiles() {
  const [values, setValues] = usePaymentsUrlState();
  const { status } = toPaymentsQuery(values);

  return (
    <div
      role="group"
      aria-label="Filter by status"
      className="grid grid-cols-6 gap-[7px] max-md:grid-cols-3"
    >
      {TILES.map((tile) => {
        const active =
          tile.status === null
            ? status.length === 0
            : status.length === 1 && status[0] === tile.status;
        return (
          <button
            key={tile.label}
            type="button"
            aria-pressed={active}
            onClick={() =>
              void setValues({
                status: tile.status === null ? [] : [tile.status],
                page: 1,
              })
            }
            className={cn(
              "h-[44px] rounded-lg border px-3 text-left text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text",
              active
                ? "border-accent font-semibold text-accent-text"
                : "border-border text-muted hover:bg-subtle",
            )}
          >
            {tile.label}
          </button>
        );
      })}
    </div>
  );
}
