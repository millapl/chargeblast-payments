"use client";

import { Upload } from "lucide-react";
import { buttonStyles } from "@/shared/ui/Button";
import { serializePaymentsSearchParams } from "../domain/url-state";
import { usePaymentsUrlState } from "../hooks/usePaymentsUrlState";

/** Downloads every payment matching the current filters and sort as CSV (not just this page). */
export function ExportLink() {
  const [values] = usePaymentsUrlState();
  const href = serializePaymentsSearchParams("/payments/export", {
    status: values.status,
    method: values.method,
    currency: values.currency,
    range: values.range,
    from: values.from,
    to: values.to,
    min: values.min,
    max: values.max,
    q: values.q,
    sort: values.sort,
  });

  return (
    <a
      href={href}
      download="payments.csv"
      className={buttonStyles("secondary", "gap-1 pr-[7px]")}
    >
      <Upload aria-hidden size={13} strokeWidth={2.25} />
      Export
    </a>
  );
}
