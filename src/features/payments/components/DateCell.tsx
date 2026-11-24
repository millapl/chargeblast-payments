"use client";

import { Tooltip } from "@/shared/ui/Tooltip";
import { formatDateTime, formatRelativeTime } from "../domain/dates";
import { usePaymentsTableContext } from "./table-context";

export function DateCell({ iso }: { iso: string }) {
  const { now } = usePaymentsTableContext();
  return (
    <Tooltip content={formatRelativeTime(iso, now)}>
      <time
        dateTime={iso}
        tabIndex={0}
        className="rounded-sm text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
      >
        {formatDateTime(iso, now)}
      </time>
    </Tooltip>
  );
}

export function OptionalDateCell({ iso }: { iso: string | null }) {
  if (iso === null) return <EmptyValue />;
  return <DateCell iso={iso} />;
}

export function EmptyValue() {
  return (
    <>
      <span aria-hidden className="text-muted">
        —
      </span>
      <span className="sr-only">None</span>
    </>
  );
}
